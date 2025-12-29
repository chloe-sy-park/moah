import { NextRequest, NextResponse } from 'next/server';
import { TelegramUpdate, sendMessage, extractUrls, MESSAGES } from '@/lib/telegram/bot';
import { isValidUrl } from '@/lib/og-parser';
import { saveFromTelegram, formatTelegramResponse } from '@/lib/content';
import { createLoginToken } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://moah-six.vercel.app';

async function getOrCreateUser(telegramId: string, telegramUsername?: string) {
  const supabase = createServiceClient();
  
  // Try to find existing user
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();
  
  if (existingUser) return existingUser;
  
  // Create new user
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      telegram_id: telegramId,
      telegram_username: telegramUsername || null,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Failed to create user:', error);
    return null;
  }
  
  return newUser;
}

export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json();
    if (!update.message) return NextResponse.json({ ok: true });

    const { message } = update;
    const chatId = message.chat.id;
    const text = message.text || '';
    const telegramUserId = message.from?.id?.toString();
    const telegramUsername = message.from?.username;

    if (!telegramUserId) return NextResponse.json({ ok: false, error: 'No user' }, { status: 400 });

    // /start command
    if (text === '/start') {
      await sendMessage(chatId, MESSAGES.WELCOME);
      return NextResponse.json({ ok: true });
    }

    // /help command
    if (text === '/help') {
      await sendMessage(chatId, MESSAGES.HELP);
      return NextResponse.json({ ok: true });
    }

    // /login command - generate magic link
    if (text === '/login') {
      const user = await getOrCreateUser(telegramUserId, telegramUsername);
      
      if (!user) {
        await sendMessage(chatId, MESSAGES.LOGIN_ERROR);
        return NextResponse.json({ ok: true });
      }
      
      const token = await createLoginToken(user.id);
      
      if (!token) {
        await sendMessage(chatId, MESSAGES.LOGIN_ERROR);
        return NextResponse.json({ ok: true });
      }
      
      const loginUrl = `${APP_URL}/api/auth/login?token=${token}`;
      await sendMessage(chatId, `${MESSAGES.LOGIN_LINK}\n\n🔗 ${loginUrl}`);
      return NextResponse.json({ ok: true });
    }

    // URL handling
    const urls = extractUrls(message);
    if (urls.length === 0) {
      await sendMessage(chatId, MESSAGES.NO_URL);
      return NextResponse.json({ ok: true });
    }

    const validUrls = urls.filter(isValidUrl);
    if (validUrls.length === 0) {
      await sendMessage(chatId, MESSAGES.NO_URL);
      return NextResponse.json({ ok: true });
    }

    await sendMessage(chatId, MESSAGES.SAVING);

    for (const url of validUrls) {
      const result = await saveFromTelegram(url, telegramUserId, telegramUsername);
      const responseText = formatTelegramResponse(result);
      await sendMessage(chatId, responseText);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}

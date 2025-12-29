import { NextRequest, NextResponse } from 'next/server';
import { TelegramUpdate, sendMessage, extractUrls, MESSAGES } from '@/lib/telegram/bot';
import { isValidUrl } from '@/lib/og-parser';
import { saveFromTelegram, formatTelegramResponse } from '@/lib/content';

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

    if (text === '/start') {
      await sendMessage(chatId, MESSAGES.WELCOME);
      return NextResponse.json({ ok: true });
    }

    if (text === '/help') {
      await sendMessage(chatId, MESSAGES.HELP);
      return NextResponse.json({ ok: true });
    }

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

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_API_BASE = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  entities?: TelegramMessageEntity[];
}

export interface TelegramMessageEntity {
  type: 'url' | 'text_link' | string;
  offset: number;
  length: number;
  url?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

export async function sendMessage(chatId: number, text: string): Promise<boolean> {
  try {
    const response = await fetch(`${TELEGRAM_API_BASE}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    const result = await response.json();
    return result.ok;
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    return false;
  }
}

export function extractUrls(message: TelegramMessage): string[] {
  const urls: string[] = [];
  if (message.entities) {
    for (const entity of message.entities) {
      if (entity.type === 'url' && message.text) {
        urls.push(message.text.substring(entity.offset, entity.offset + entity.length));
      }
      if (entity.type === 'text_link' && entity.url) urls.push(entity.url);
    }
  }
  if (urls.length === 0 && message.text) {
    const matches = message.text.match(/(https?:\/\/[^\s]+)/g);
    if (matches) urls.push(...matches);
  }
  return urls;
}

export const MESSAGES = {
  WELCOME: '👋 moah에 오신 것을 환영합니다!\n\nURL을 보내주시면 자동으로 저장해드려요.',
  HELP: '📝 사용법\n\n1. URL을 보내주세요\n2. 자동으로 저장됩니다\n3. moah 앱에서 확인하세요',
  NO_URL: '❌ URL을 찾을 수 없어요. 유효한 URL을 보내주세요.',
  SAVING: '⏳ 저장 중...',
  ERROR: '❌ 오류가 발생했어요. 다시 시도해주세요.',
};

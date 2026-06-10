import { NextRequest, NextResponse } from "next/server";

import { hashOpaqueToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type TelegramWebhookUser = {
  id: number;
  is_bot?: boolean;
  first_name?: string;
  last_name?: string;
  username?: string;
};

type TelegramWebhookMessage = {
  text?: string;
  chat?: {
    id: number | string;
  };
  from?: TelegramWebhookUser;
};

type TelegramWebhookUpdate = {
  message?: TelegramWebhookMessage;
  edited_message?: TelegramWebhookMessage;
};

function extractLoginToken(text?: string) {
  const match = text?.trim().match(/^\/start(?:@\w+)?\s+auth_([A-Za-z0-9_-]{20,96})$/);
  return match?.[1] ?? null;
}

async function sendTelegramMessage(chatId: number | string | undefined, text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken || chatId === undefined) {
    return;
  }

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true
      })
    });
  } catch {
    // Telegram will retry the webhook if this request fails; message delivery is best-effort here.
  }
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();

  if (webhookSecret && request.headers.get("x-telegram-bot-api-secret-token") !== webhookSecret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: TelegramWebhookUpdate;

  try {
    update = (await request.json()) as TelegramWebhookUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  const message = update.message ?? update.edited_message;
  const chatId = message?.chat?.id;
  const from = message?.from;
  const rawToken = extractLoginToken(message?.text);

  if (!rawToken) {
    await sendTelegramMessage(
      chatId,
      `Откройте вход через Telegram на сайте ${process.env.APP_URL ?? "https://uchi-slovo.ru"} и нажмите кнопку снова.`
    );
    return NextResponse.json({ ok: true });
  }

  if (!from?.id || from.is_bot) {
    await sendTelegramMessage(
      chatId,
      "Не удалось определить Telegram-пользователя. Попробуйте ещё раз с личного аккаунта."
    );
    return NextResponse.json({ ok: true });
  }

  const loginToken = await prisma.telegramLoginToken.findUnique({
    where: { tokenHash: hashOpaqueToken(rawToken) }
  });

  if (!loginToken || loginToken.usedAt || loginToken.expiresAt.getTime() <= Date.now()) {
    await sendTelegramMessage(chatId, "Ссылка для входа устарела. Вернитесь на сайт и нажмите Telegram ещё раз.");
    return NextResponse.json({ ok: true });
  }

  await prisma.telegramLoginToken.update({
    where: { id: loginToken.id },
    data: {
      telegramId: String(from.id),
      username: from.username ?? null,
      firstName: from.first_name ?? null,
      lastName: from.last_name ?? null,
      photoUrl: null
    }
  });

  await sendTelegramMessage(chatId, "Готово. Вернитесь на сайт, вход через Telegram подтверждён.");

  return NextResponse.json({ ok: true });
}

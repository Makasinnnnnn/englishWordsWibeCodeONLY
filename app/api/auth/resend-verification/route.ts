import { NextRequest } from "next/server";

import { authError, authOk, getCurrentUser } from "@/lib/auth";
import { sendVerificationForUser } from "@/lib/auth/email-verification";
import { checkRateLimit, getClientIp, makeRateLimitKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return authError("UNAUTHORIZED", "Authentication required", 401);
    }

    const rateLimit = checkRateLimit(
      makeRateLimitKey("resend-verification", getClientIp(request.headers), user.id),
      3,
      60 * 60 * 1000
    );

    if (!rateLimit.allowed) {
      return authError("RATE_LIMITED", "Слишком много писем. Попробуйте позже.", 429);
    }

    await sendVerificationForUser(user.id);

    return authOk({
      message: "Если email ожидает подтверждения, мы отправили новую ссылку."
    });
  } catch {
    return authError("INTERNAL_ERROR", "Не удалось отправить письмо подтверждения", 500);
  }
}

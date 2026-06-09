import nodemailer from "nodemailer";

function getAppUrl() {
  return process.env.APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

export function buildPasswordResetUrl(token: string) {
  return `${getAppUrl()}/reset-password?token=${encodeURIComponent(token)}`;
}

function hasSmtpConfig() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_FROM);
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const ttl = process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES ?? "30";
  const subject = "Reset your password";
  const text = [
    "We received a request to reset your Word Memory Trainer password.",
    "",
    `Open this link to choose a new password: ${resetUrl}`,
    "",
    `This link expires in ${ttl} minutes.`,
    "If you did not request this, you can ignore this email."
  ].join("\n");

  if (!hasSmtpConfig()) {
    console.info("[dev-mailer] Password reset email was not sent because SMTP is not configured.");
    console.info(`[dev-mailer] To: ${email}`);
    console.info(`[dev-mailer] Reset link: ${resetUrl}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      : undefined
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject,
    text
  });
}

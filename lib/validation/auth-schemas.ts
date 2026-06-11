import { z } from "zod";

const loginPattern = /^[a-zA-Z0-9][a-zA-Z0-9._-]{2,39}$/;

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(5, "Введите email")
  .max(160, "Email слишком длинный")
  .email("Введите корректный email");

const legacyEmailOrLoginSchema = z
  .string()
  .trim()
  .min(3, "Введите email или логин")
  .max(160, "Слишком длинный email или логин")
  .refine(
    (value) => value.includes("@") || loginPattern.test(value),
    "Логин: 3-40 символов, латиница, цифры, точка, дефис или подчеркивание"
  )
  .refine((value) => !value.includes("@") || z.string().email().safeParse(value).success, "Введите корректный email");

export const passwordSchema = z
  .string()
  .min(8, "Пароль должен быть минимум 8 символов")
  .max(200, "Пароль слишком длинный")
  .refine((value) => value.trim().length >= 8, "Пароль не может состоять только из пробелов")
  .refine((value) => /[A-Za-zА-Яа-я]/.test(value) && /\d/.test(value), "Пароль должен содержать буквы и цифры");

export const loginSchema = z.object({
  email: legacyEmailOrLoginSchema,
  password: z.string().min(1, "Введите пароль").max(200, "Пароль слишком длинный")
});

export const registerSchema = z
  .object({
    email: emailSchema,
    displayName: z.string().trim().max(80, "Имя слишком длинное").optional().or(z.literal("")),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Повторите пароль")
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Пароли не совпадают"
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema
});

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(20, "Некорректная ссылка восстановления"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Повторите пароль")
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Пароли не совпадают"
  });

export const verifyEmailSchema = z.object({
  token: z.string().trim().min(20, "Некорректная ссылка подтверждения")
});

export const setPasswordSchema = z
  .object({
    email: emailSchema,
    displayName: z.string().trim().max(80, "Имя слишком длинное").optional().or(z.literal("")),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Повторите пароль")
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Пароли не совпадают"
  });

const stringFromTelegramValue = z.preprocess((value) => {
  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }

  return value;
}, z.string().trim().min(1));

export const telegramAuthSchema = z.object({
  id: stringFromTelegramValue,
  first_name: z.string().trim().max(120).optional(),
  last_name: z.string().trim().max(120).optional(),
  username: z.string().trim().max(120).optional(),
  photo_url: z.string().trim().url().max(1000).optional(),
  auth_date: z.coerce.number().int().positive(),
  hash: z.string().trim().min(32)
});

export const linkTelegramSchema = telegramAuthSchema;

export const telegramBotStartSchema = z.object({
  mode: z.enum(["auth", "link"]).default("auth")
});

export const telegramBotTokenSchema = z.object({
  token: z
    .string()
    .trim()
    .min(20, "Некорректная ссылка Telegram")
    .max(96, "Некорректная ссылка Telegram")
    .regex(/^[A-Za-z0-9_-]+$/, "Некорректная ссылка Telegram")
});

export const authSchema = loginSchema;

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;
export type TelegramAuthInput = z.infer<typeof telegramAuthSchema>;
export type TelegramBotStartInput = z.infer<typeof telegramBotStartSchema>;
export type TelegramBotTokenInput = z.infer<typeof telegramBotTokenSchema>;

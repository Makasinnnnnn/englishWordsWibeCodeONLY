import { z } from "zod";

const loginPattern = /^[a-zA-Z0-9][a-zA-Z0-9._-]{2,39}$/;

export const authSchema = z.object({
  email: z
    .string()
    .trim()
    .min(3, "Введите email или логин")
    .max(160, "Слишком длинный email или логин")
    .refine((value) => value.includes("@") || loginPattern.test(value), "Логин: 3-40 символов, латиница, цифры, точка, дефис или подчёркивание")
    .refine((value) => !value.includes("@") || z.string().email().safeParse(value).success, "Введите корректный email"),
  password: z.string().min(8, "Пароль должен быть минимум 8 символов").max(200, "Пароль слишком длинный")
});

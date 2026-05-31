import { z } from "zod";

export const authSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(160),
  password: z.string().min(8, "Password must be at least 8 characters").max(200)
});

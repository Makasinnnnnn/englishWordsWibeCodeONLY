import { z } from "zod";

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
};

export const difficultySchema = z.enum(["easy", "medium", "hard"]);

const remoteImageUrlSchema = z
  .string()
  .trim()
  .url()
  .max(1000, "Image URL is too long")
  .refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  }, "Image URL must use http or https");

const imageValueSchema = z.union([
  remoteImageUrlSchema,
  z.string().startsWith("data:image/", "Uploaded file must be an image").max(2_500_000, "Image file is too large")
]);

export const wordMutationSchema = z.object({
  english: z.string().trim().min(1, "English word is required").max(80),
  translation: z.string().trim().min(1, "Translation is required").max(160),
  association: z.preprocess(emptyToUndefined, z.string().trim().max(240).optional()),
  imageUrl: z.preprocess(emptyToUndefined, imageValueSchema.optional()),
  notes: z.preprocess(emptyToUndefined, z.string().trim().max(1200).optional()),
  difficulty: difficultySchema.default("medium")
});

export const wordUpdateSchema = wordMutationSchema.partial().extend({
  learningLevel: z.number().int().min(0).max(5).optional(),
  isLearned: z.boolean().optional(),
  nextReviewAt: z.string().datetime().nullable().optional()
});

export const reviewSchema = z.object({
  result: z.enum(["correct", "typo", "wrong"])
});

export const suggestionQuerySchema = z.object({
  word: z.string().trim().min(1, "Word is required").max(80),
  association: z.string().trim().max(240).optional()
});

export type WordMutationInput = z.infer<typeof wordMutationSchema>;
export type WordUpdateInput = z.infer<typeof wordUpdateSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type SuggestionQueryInput = z.infer<typeof suggestionQuerySchema>;

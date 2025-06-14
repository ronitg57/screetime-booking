
import { z } from "zod";

export const ScreenUpsertSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name is too long"),
  location: z.string().min(3, "Location must be at least 3 characters").max(150, "Location is too long"),
  specs: z.string().min(3, "Specifications must be at least 3 characters").max(255, "Specs are too long"),
  imageUrl: z.string().url("Image URL must be a valid URL").max(2048, "Image URL is too long").or(z.literal("")).optional().nullable(),
  dataAiHint: z.string().max(50, "AI hint is too long").optional().nullable(),
});
export type ScreenUpsertData = z.infer<typeof ScreenUpsertSchema>;

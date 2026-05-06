import * as z from "zod";

/**
 * References the party which the candidate was nominated for
 */
export const PartySchema = z.object({
  url: z.string(),
  ec_id: z.string(),
  name: z.string(),
  legacy_slug: z.string(),
  created: z.coerce.date(),
  modified: z.coerce.date(),
});
export type Party = z.infer<typeof PartySchema>;

/**
 * References the person who was elected
 */
export const PersonRefSchema = z.object({
  id: z.number(),
  url: z.string(),
  name: z.string(),
});
export type PersonRef = z.infer<typeof PersonRefSchema>;

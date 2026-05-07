/**
 * Get the data from the english council page
 */

import * as z from "zod";

export const WinnerFlashSchema = z.object({
  displayMode: z.string(),
  year: z.number(),
  prevYear: z.string(),
  newColour: z.string(),
  prevColour: z.string(),
  flash: z.string(),
  longFlash: z.string(),
  textColour: z.string(),
  partyName: z.string(),
  flashBold: z.string(),
  flashRegular: z.string(),
  winnerPartyCode: z.string(),
  prevWinnerPartyCode: z.string(),
  explainer: z.any(),
});
export type WinnerFlash = z.infer<typeof WinnerFlashSchema>;

export const CardSchema = z.object({
  title: z.string(),
  href: z.string(),
  winnerFlash: z.union([z.null(), WinnerFlashSchema]),
  context: z.union([z.null(), z.any()]),
});
export type Card = z.infer<typeof CardSchema>;

export const GroupSchema = z.object({
  id: z.string(),
  heading: z.string(),
  cards: z.array(CardSchema),
  backToTop: z.boolean(),
});
export type Group = z.infer<typeof GroupSchema>;

export const BBCResultSchema = z.object({
  metadata: z.any(),
  language: z.string(),
  heading: z.string(),
  campaignMode: z.boolean(),
  bannerUri: z.string(),
  logoUrl: z.string(),
  logoAlt: z.string(),
  editorialText: z.any(),
  links: z.any(),
  key: z.array(z.any()),
  groups: z.array(GroupSchema),
  labels: z.any(),
  topicTags: z.any(),
  onwardJourneys: z.any(),
});
export type BBCResult = z.infer<typeof BBCResultSchema>;

const BBC_URL: string =
  "https://static.files.bbci.co.uk/elections/data/news/election/2026/england/councils";

export async function fetchCouncilData(): Promise<BBCResult> {
  try {
    const request = await fetch(BBC_URL + "?t=" + new Date().toISOString());
    const data = await BBCResultSchema.parseAsync(await request.json());

    return data;
  } catch (error) {
    console.error("fetching bbc data england ", error);
    throw error;
  }
}

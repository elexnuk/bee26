import { BBCResultSchema, type BBCResult } from "./england";

const BBC_URL: string =
  "https://static.files.bbci.co.uk/elections/data/news/election/2026/scotland/constituencies";

export async function fetchScotParlData(): Promise<BBCResult> {
  try {
    const request = await fetch(BBC_URL + "?t=" + new Date().toISOString());
    const data = await BBCResultSchema.parseAsync(await request.json());

    return data;
  } catch (error) {
    console.error("fetching bbc data scotland ", error);
    throw error;
  }
}

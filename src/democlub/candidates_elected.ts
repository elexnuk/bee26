import * as z from "zod";
import { addRequestCount, DCError, numberOfRequests, token } from "./util";
import { getBallot, type BallotData, type Result } from "./ballots";
import { PartySchema, PersonRefSchema } from "./party";

/**
 * References the ballot paper which the candidate was elected on
 */
export const BallotRefSchema = z.object({
  url: z.string(),
  ballot_paper_id: z.string(),
});
export type BallotRef = z.infer<typeof BallotRefSchema>;

/**
 * Links the candidate elected to the given ballot for a specific party. Includes extra information like deselections, SOPN, party list position
 */
export const ElectedSchema = z.object({
  elected: z.boolean(),
  party_list_position: z.union([z.null(), z.number()]),
  party: PartySchema,
  party_name: z.string(),
  party_description_text: z.string(),
  deselected: z.boolean(),
  deselected_source: z.union([z.null(), z.string()]),
  sopn_last_name: z.string(),
  sopn_first_names: z.string(),
  created: z.coerce.date(),
  modified: z.coerce.date(),
  ballot: BallotRefSchema,
  previous_party_affiliations: z.array(PartySchema),
  person: PersonRefSchema,
});
export type Elected = z.infer<typeof ElectedSchema>;

export type ElectedWithBallot = Omit<Elected, "ballot"> & {
  ballot: BallotData;
  result: Result | null;
};

/**
 * Return from the democracy club API, paginated.
 */
export const CandidatesElectedSchema = z.object({
  count: z.number(),
  next: z.union([z.null(), z.string()]),
  previous: z.union([z.null(), z.string()]),
  results: z.array(ElectedSchema),
});
export type CandidatesElected = z.infer<typeof CandidatesElectedSchema>;

/**
 * Fetch candidates elected with changes since `lastUpdated`
 * @param lastUpdated Only show candidates which have had their elected status updated after this datetime
 * @returns CandidatesElected information
 */
export async function candidatesElectedSince(
  lastUpdated: Date,
): Promise<ElectedWithBallot[]> {
  const candidates: ElectedWithBallot[] = [];
  const ballots: Map<string, BallotData> = new Map();

  let next_url: string | null =
    `https://candidates.democracyclub.org.uk/api/next/candidates_elected/?last_updated=${lastUpdated.toISOString()}&${token()}`;

  while (next_url != null) {
    try {
      const request = await fetch(next_url, {});
      // HTTP error code
      if (request.status < 200 || request.status >= 400) {
        throw request;
      }
      addRequestCount();

      const candidatesElectedData = await CandidatesElectedSchema.parseAsync(
        await request.json(),
      );

      for (let candidateElected of candidatesElectedData.results) {
        let ballot = ballots.get(candidateElected.ballot.ballot_paper_id);
        if (!ballot) {
          ballot = await getBallot(candidateElected.ballot);
          ballots.set(candidateElected.ballot.ballot_paper_id, ballot);
        }

        // add in the result data to the mix, if it's there
        let candidacyResult =
          ballot.candidacies.find(
            (c) => c.person.id == candidateElected.person.id,
          )?.result || null;

        if (ballot.election.current) {
          let candidateData: ElectedWithBallot = {
            ...candidateElected,
            ballot,
            result: candidacyResult,
          };
          candidates.push(candidateData);
        }
      }

      next_url = candidatesElectedData.next;
    } catch (error) {
      console.error("fetching url:", next_url);
      console.error("request count:", numberOfRequests);
      if (error instanceof z.ZodError) {
        throw new DCError("Error parsing elected data", error.issues);
      }

      throw new DCError("Error fetching from API", error);
    }
  }

  return candidates;
}

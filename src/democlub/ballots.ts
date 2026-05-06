import * as z from "zod";
import { addRequestCount, DCError, token } from "./util";
import { type BallotRef } from "./candidates_elected";
import { PartySchema, PersonRefSchema } from "./party";

export const ResultSchema = z.object({
  elected: z.union([z.null(), z.boolean()]),
  num_ballots: z.number(),
});
export type Result = z.infer<typeof ResultSchema>;

export const ElectionSchema = z.object({
  election_id: z.string(),
  url: z.string(),
  name: z.string(),
  election_date: z.string(),
  current: z.boolean(),
  party_lists_in_use: z.boolean(),
  created: z.coerce.date(),
  last_updated: z.coerce.date(),
});
export type Election = z.infer<typeof ElectionSchema>;

export const PostSchema = z.object({
  id: z.string(),
  label: z.string(),
  slug: z.string(),
  created: z.coerce.date(),
  last_updated: z.coerce.date(),
});
export type Post = z.infer<typeof PostSchema>;

export const ResultsSchema = z.object({
  num_turnout_reported: z.any(),
  turnout_percentage: z.any(),
  num_spoilt_ballots: z.any(),
  source: z.string(),
  total_electorate: z.any(),
});
export type Results = z.infer<typeof ResultsSchema>;

export const SopnSchema = z.object({
  uploaded_file: z.string(),
  source_url: z.string(),
});
export type Sopn = z.infer<typeof SopnSchema>;

export const Nuts1Schema = z.object({
  key: z.string(),
  value: z.string(),
});
export type Nuts1 = z.infer<typeof Nuts1Schema>;

export const CandidacySchema = z.object({
  elected: z.union([z.null(), z.boolean()]),
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
  person: PersonRefSchema,
  result: z.union([z.null(), ResultSchema]),
});
export type Candidacy = z.infer<typeof CandidacySchema>;

export const TagsSchema = z.object({
  NUTS1: z.optional(Nuts1Schema),
});
export type Tags = z.infer<typeof TagsSchema>;

export const BallotDataSchema = z.object({
  url: z.string(),
  history_url: z.string(),
  results_url: z.string(),
  election: ElectionSchema,
  post: PostSchema,
  winner_count: z.number(),
  ballot_paper_id: z.string(),
  cancelled: z.boolean(),
  sopn: z.union([z.null(), SopnSchema]),
  candidates_locked: z.boolean(),
  candidacies: z.array(CandidacySchema),
  created: z.coerce.date(),
  last_updated: z.coerce.date(),
  replaces: z.union([z.null(), z.string()]),
  replaced_by: z.union([z.null(), z.string()]),
  uncontested: z.boolean(),
  results: z.union([z.null(), ResultsSchema]),
  voting_system: z.string(),
  tags: TagsSchema,
  by_election_reason: z.string(),
});
export type BallotData = z.infer<typeof BallotDataSchema>;

export async function getBallot(ballot: BallotRef): Promise<BallotData> {
  try {
    const request = await fetch(ballot.url + "?" + token(), {});
    addRequestCount();

    // HTTP error code
    if (request.status < 200 || request.status >= 400) {
      throw request;
    }

    const ballotJson = await request.json();
    const ballotData = await BallotDataSchema.parseAsync(ballotJson);

    return ballotData;
  } catch (error) {
    console.error("fetching url:", ballot.url);
    if (error instanceof z.ZodError) {
      throw new DCError("Error parsing ballot data", error.issues);
    }
    throw new DCError("Error fetching ballot from API", error);
  }
}

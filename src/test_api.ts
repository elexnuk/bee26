import { candidatesElectedSince } from "./democlub/candidates_elected";
import { headers, numberOfRequests } from "./democlub/util";
import { Database } from "bun:sqlite";

console.log("Hello via Bun!");
console.log("headers", headers());

export const elexn_database = new Database(process.env.DATABASE_PATH, {
  strict: true,
});

let candidates = await candidatesElectedSince(
  new Date("2026-04-029T00:00:00Z"),
);

for (let candidate of candidates) {
  console.log(
    "Candidate",
    candidate.person.name,
    "elected for",
    candidate.party.name,
    "in",
    candidate.ballot.election.name,
    ":",
    candidate.ballot.post.label,
  );
}

console.log("made", numberOfRequests, "requests");

/**
 * Fetches the latest results from Democracy Club
 */

/**
 * Store a "last updated" field in the sqlite database.
 *  if not present use current day at midnight
 *
 * Fetch all new candidates elected since the last updated field
 *   (auto filters to active elections + fetches ballot information)
 *   check if the ballot paper has been announced before
 *      if announced then check if the winners have changed
 *          if winners have changed => announce abllot
 *          else winners not changed, move on
 *      else not announced => announce ballot
 *   Set last updated to timestamp of last updated of last announced ballot
 *
 */
import * as z from "zod";
import { Database } from "bun:sqlite";
import {
  BallotInformation,
  getBallotInformation,
  getLastUpdated,
  LastUpdated,
  setBallotInformation,
  setLastUpdated,
} from "../store/ballots";
import {
  candidatesElectedSince,
  type ElectedWithBallot,
} from "../democlub/candidates_elected";
import type { BallotData } from "../democlub/ballots";
import type { Client } from "discord.js";
import { getAnnouncementChannels } from "../store/channels";

/**
 * Maps the start of the ballot/election slug to the type of role
 */
const electionPosts = {
  europarl: "Member of the European Parliament",
  gla: "Assembly Member",
  local: "Councillor",
  mayor: "Mayor",
  naw: "Assembly Member",
  nia: "Member of the Legislative Assembly",
  pcc: "Police and Crime Commissioner",
  sp: "Member of the Scottish Parliament",
  senedd: "Member of the Senedd",
  parl: "Member of Parliament",
};

function getElectionPost(ballot_id: string): string {
  let electionPost = "Member";
  Object.entries(electionPosts).forEach(([election, post]) => {
    if (ballot_id.startsWith(election)) {
      electionPost = post;
    }
  });

  // fallback
  return electionPost;
}

/**
 * Maps party EC IDs to a discord emoji
 */
let partyIdEmoji: Dict<string>;

// Test App config
if (process.env.NODE_ENV != "production") {
  partyIdEmoji = {
    PP52: "<:Conservative:1500963713547505715>", // Con
    PP53: "<:Labour:1500963717716770907>", // Lab
    "joint-party:53-119":
      "<:Labour:1500963717716770907> <:CoOperative:1500963711601610853>", // Lab Co-op
    PP90: "<:LibDem:1500963719360806942>", // LD
    PP63: "<:Green:1500963716001435648>", // Grn
    PP7931: "<:ReformUK:1500963698259267604>", // RefUK
    PP102: "<:SNP:1500963696506044426>", // SNP
    PP77: "<:PlaidCymru:1500963699907756112>", // PC
    PP11382: "<:WPB:1500963691451912302>", // WPB
    // Aspire
    // TUSC
    // SGP
    // SDP
    // UKIP
    // OMRLP
    // YourParty
    other: "⚪", // Other/Inds
  };
} else {
  // Production Config
  partyIdEmoji = {
    PP52: "<:Conservative:1500964868197449778>", // Con
    PP53: "<:Labour:1500964871569932499>", // Lab
    "joint-party:53-119":
      "<:Labour:1500964871569932499> <:CoOperative:1500964866481983642>", // Lab Co-op
    PP90: "<:LibDem:1500964873461301329>", // LD
    PP63: "<:Green:1500964869929697501>", // Grn
    PP7931: "<:ReformUK:1500964860354363574>", // RefUK
    PP102: "<:SNP:1500964858601017405>", // SNP
    PP77: "<:PlaidCymru:1500964861742682295>", // PC
    PP11382: "<:WPB:1500964851818696754>", // WPB
    PP6713: "<:Aspire:1500964865081344172>", // Aspire // TODO
    PP804: "<:TUSC:1500964853089702040>", // TUSC
    PP130: "<:SGP:1500964855786766366>", // SGP
    PP243: "<:SDP:1500964850380046408>", // SDP
    PP85: "<:UKIP:1500964849012965567>", // UKIP
    PP66: "<:OMRLP:1500964863449628812>", // OMRLP
    PP18172: "<:YourParty:1500491954020942066>", // YourParty
    other: "⚪", // Other/Inds
  };
}

function getPartyEmoji(party_id: string): string {
  let partyEmoji = partyIdEmoji.other;
  Object.entries(partyIdEmoji).forEach(([party, emoji]) => {
    if (party == party_id) {
      partyEmoji = emoji;
    }
  });

  // fallback
  return partyEmoji || "⚪";
}

function createDiscordMessage(
  ballot: BallotData,
  candidates: ElectedWithBallot[],
) {
  let sortedElectedCandidates = candidates.toSorted((a, b) => {
    return (b.result?.num_ballots || 0) - (a.result?.num_ballots || 0);
  });

  let partyEmojis = sortedElectedCandidates.reduce<string>((acc, c) => {
    return acc + getPartyEmoji(c.party.ec_id) + " ";
  }, "");

  let output = `## ${partyEmojis} ${ballot.post.label} (${ballot.election.name})\n`;
  sortedElectedCandidates.forEach((candidate) => {
    let post = getElectionPost(ballot.ballot_paper_id);
    let publicUrl = `https://whocanivotefor.co.uk/person/${candidate.person.id}/`;
    let candidateOutput = `- ${candidate.party.name} candidate [${candidate.person.name}](<${publicUrl}>) is the new ${post}`;
    if (candidate.deselected) {
      candidateOutput += `  - Candidate [Deselected](<${candidate.deselected_source}>)`;
    }
    output += candidateOutput + "\n";
  });

  let publicUrl = `https://whocanivotefor.co.uk/elections/${ballot.ballot_paper_id}/`;
  output += `-# *Democracy Club Data: [${ballot.post.label}, ${ballot.election.name}, ${ballot.election.election_date}](<${publicUrl}>)*`;

  return output;
}

async function sendToDiscord(
  client: Client,
  database: Database,
  message: string,
) {
  let channels = getAnnouncementChannels(database);
  for (let channelId of channels) {
    const channel = await client.channels.fetch(channelId.channel_id);
    if (channel?.isSendable()) {
      channel.send(message).catch((error) => {
        console.error(`sending to ${channelId.channel_id} failed:`, error);
      });
    }
  }
}

export async function runDC(database: Database, client: Client) {
  const lastUpdated = getLastUpdated(database);
  const newlyElectedCandidates = await candidatesElectedSince(
    new Date(lastUpdated.last_updated),
  );

  console.log(
    "Picked up",
    newlyElectedCandidates.length,
    " new elected candidates at",
    lastUpdated.last_updated,
  );

  // collate by ballot
  let electionResults: Map<string, ElectedWithBallot[]> = new Map();
  for (let elected of newlyElectedCandidates) {
    electionResults
      .getOrInsert(elected.ballot.ballot_paper_id, [])
      .push(elected);
  }

  for (let [ballot, elected] of electionResults.entries()) {
    const ballotInfo = getBallotInformation(database, ballot);
    let candidateIds = new Set(elected.map((p) => p.person.id));
    let ballotData = elected[0]?.ballot;
    if (!ballotData) {
      console.error("No ballot information for", ballot, "skipping");
      continue;
    }

    if (ballotInfo) {
      let prevWinners = new Set(
        z.array(z.number()).parse(JSON.parse(ballotInfo.winners)),
      );
      if (candidateIds == prevWinners) {
        console.log("No change in winners for duplicate ballot", ballot);
        continue;
      } else {
        // Announce this ballot
        let text = createDiscordMessage(ballotData, elected);
        await sendToDiscord(client, database, text);
      }
    } else {
      // Announce this ballot
      let text = createDiscordMessage(ballotData, elected);
      await sendToDiscord(client, database, text);
    }

    setBallotInformation(
      database,
      new BallotInformation(
        ballot,
        JSON.stringify([...candidateIds]),
        new Date().toISOString(),
      ),
    );

    let nextDate = elected[0]?.modified;
    nextDate?.setMilliseconds(nextDate.getMilliseconds() + 1);

    setLastUpdated(
      database,
      new LastUpdated(
        "ballot",
        nextDate?.toISOString() || new Date().toISOString(),
      ),
    );
  }
}

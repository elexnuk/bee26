/**
 * handles interacting with the database and ballots
 */

import { Database } from "bun:sqlite";

/**
 * Create a table in the database which keeps track of the "last updated" ballot timestamp
 * @param db database connection
 */
function createLastUpdatedTable(db: Database) {
  db.query(
    "CREATE TABLE IF NOT EXISTS last_updated ( key TEXT PRIMARY KEY NOT NULL DEFAULT 'ballot', last_updated TEXT NOT NULL );",
  ).run();
}

export class LastUpdated {
  key: string;
  last_updated: string;

  constructor(key: string, last_updated: string) {
    this.key = key;
    this.last_updated = last_updated;
  }
}

/**
 * Create a table in the database which keeps track of the ballots announced and their winners
 * @param db database connection
 */
function createBallotInformationTable(db: Database) {
  db.query(
    "CREATE TABLE IF NOT EXISTS ballot_information ( ballot_id TEXT PRIMARY KEY NOT NULL, winners TEXT NOT NULL, announced TEXT NOT NULL )",
  ).run();
}

export class BallotInformation {
  ballot_id: string;
  winners: string;
  announced: string;

  constructor(ballot_id: string, winners: string, announced: string) {
    this.ballot_id = ballot_id;
    this.winners = winners;
    this.announced = announced;
  }
}

export function createSchema(db: Database) {
  createLastUpdatedTable(db);
  createBallotInformationTable(db);
}

export function setLastUpdated(db: Database, last_updated: LastUpdated) {
  const query = db.query(
    "INSERT INTO last_updated(key, last_updated) VALUES ('ballot', $last_updated) ON CONFLICT (key) DO UPDATE SET last_updated = excluded.last_updated;",
  );
  query.run({ last_updated: last_updated.last_updated });
}

export function getLastUpdated(db: Database): LastUpdated {
  const query = db.query("SELECT * FROM last_updated;").as(LastUpdated);
  let last_updated = query.get();
  if (!last_updated) {
    let midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    setLastUpdated(db, new LastUpdated("ballot", midnight.toISOString()));
    return getLastUpdated(db);
  }

  return last_updated;
}

export function setBallotInformation(
  db: Database,
  ballotInformation: BallotInformation,
) {
  const query = db.query(`
        INSERT INTO ballot_information (ballot_id, winners, announced) 
        VALUES ($ballot_id, $winners, $announced)
        ON CONFLICT (ballot_id) DO UPDATE SET winners = excluded.winners, announced = excluded.announced;`);

  query.run({
    ballot_id: ballotInformation.ballot_id,
    winners: ballotInformation.winners,
    announced: ballotInformation.announced,
  });
}

export function getBallotInformation(
  db: Database,
  ballot_id: string,
): BallotInformation | null {
  const query = db
    .query("SELECT * FROM ballot_information WHERE ballot_id = $ballot_id")
    .as(BallotInformation);
  const ballotInformation = query.get({ ballot_id });

  return ballotInformation;
}

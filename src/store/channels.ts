/**
 * handles specifying the announcement channel in a server
 */

import { Database } from "bun:sqlite";

export function createChannelTable(db: Database) {
  db.query(
    `CREATE TABLE IF NOT EXISTS channels ( guild_id TEXT PRIMARY KEY, channel_id TEXT NOT NULL );`,
  ).run();
}

export class AnnouncementChannel {
  guild_id: string;
  channel_id: string;

  constructor(guild_id: string, channel_id: string) {
    this.guild_id = guild_id;
    this.channel_id = channel_id;
  }
}

export function setGuildAnnouncementChannel(
  database: Database,
  channel: AnnouncementChannel,
) {
  const query = database.query(
    `INSERT INTO channels (guild_id, channel_id) VALUES ($guild_id, $channel_id)
     ON CONFLICT (guild_id) DO UPDATE SET channel_id = excluded.channel_id;`,
  );

  query.run({ guild_id: channel.guild_id, channel_id: channel.channel_id });
}

export function getAnnouncementChannels(
  database: Database,
): AnnouncementChannel[] {
  const query = database
    .query("SELECT * FROM channels;")
    .as(AnnouncementChannel);
  return query.all();
}

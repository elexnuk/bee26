/**
 * Stores BBC names and the flashes
 */

import { Database } from "bun:sqlite";

export function createBBCDatabase(db: Database) {
  db.query(
    `CREATE TABLE IF NOT EXISTS bbc_flash (
        title TEXT PRIMARY KEY,
        flash TEXT
        );`,
  ).run();
}

export class BBCFlash {
  title: string;
  flash: string | null;

  constructor(title: string, flash: string | null) {
    this.title = title;
    this.flash = flash;
  }
}

export function getFlash(db: Database): BBCFlash[] {
  const titles = db.query("SELECT * FROM bbc_flash;").as(BBCFlash);

  return titles.all();
}

export function setFlash(db: Database, flash: BBCFlash) {
  const query = db.query(
    "INSERT INTO bbc_flash (title, flash) VALUES ($title, $flash) ON CONFLICT (title) DO UPDATE SET flash = excluded.flash;",
  );

  query.run({ title: flash.title, flash: flash.flash });
}

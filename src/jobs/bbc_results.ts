import { Database } from "bun:sqlite";
import type { Client } from "discord.js";
import { fetchCouncilData } from "../bbc/england";
import { fetchSeneddData } from "../bbc/wales";
import { fetchScotParlData } from "../bbc/scotland";
import { BBCFlash, getFlash, setFlash } from "../store/bbcflash";
import { sendToDiscord } from "./dc_results";

export async function runBBC(database: Database, client: Client) {
  const england = await fetchCouncilData();
  const wales = await fetchSeneddData();
  const scotland = await fetchScotParlData();

  let campaignModeEng = england.campaignMode;

  const previous = getFlash(database);
  let mapTitlePrevious: Map<string, string | null> = new Map();
  previous.map((flash) => mapTitlePrevious.set(flash.title, flash.flash));

  try {
    let previousCampaignMode = mapTitlePrevious.get("campaignModeEng");
    if (previousCampaignMode === undefined) {
      setFlash(
        database,
        new BBCFlash("campaignModeEng", JSON.stringify(campaignModeEng)),
      );
    } else {
      let prev = JSON.parse(previousCampaignMode || "null");
      if (prev !== campaignModeEng) {
        setFlash(
          database,
          new BBCFlash("campaignModeEng", JSON.stringify(campaignModeEng)),
        );
        if (campaignModeEng === false) {
          await sendToDiscord(
            client,
            database,
            `## Campaign Mode has ended
-# *BBC Data*`,
          );
        }
      }
    }
  } catch (error) {
    console.error("updating campaign mode", error);
  }

  let groups = england.groups.concat(wales.groups).concat(scotland.groups);
  let changed = 0;
  for (let group of groups) {
    for (let card of group.cards) {
      try {
        let prevFlash = mapTitlePrevious.get(card.title);
        let currentFlash = card.winnerFlash?.flash || null;
        if (prevFlash === undefined) {
          setFlash(database, new BBCFlash(card.title, currentFlash));
        } else if (prevFlash !== currentFlash) {
          setFlash(database, new BBCFlash(card.title, currentFlash));
          changed++;
          if (currentFlash != null) {
            await sendToDiscord(
              client,
              database,
              `## 🚨 BBC Call: ${card.title}: ${currentFlash}
-# *BBC Data: [${card.title}](https://www.bbc.co.uk${card.href})*`,
            );
          }
        }
      } catch (error) {
        console.error("updating", card, "caused", error);
      }
    }
  }

  console.log("checked", groups.length, "groups.", changed, "cards changed");
}

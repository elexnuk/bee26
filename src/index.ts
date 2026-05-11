import {
  Client,
  GatewayIntentBits,
  Events,
  ActivityType,
  Collection,
  MessageFlags,
  type Interaction,
} from "discord.js";
import { Database } from "bun:sqlite";
import { runDC } from "./jobs/dc_results";
import { createSchema } from "./store/ballots";
import { createChannelTable } from "./store/channels";
import { handlePingCommand, pingCommand } from "./commands/ping";
import {
  handleSetChannelCommand,
  setChannelCommand,
} from "./commands/set_channel";
import { handleVotedCommand, votedCommand } from "./commands/server/voted";
import { handleModalResponse, showModal } from "./commands/server/feedback";
import { createBBCDatabase } from "./store/bbcflash";
import { runBBC } from "./jobs/bbc_results";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const database = new Database(process.env.DATABASE_PATH, {
  strict: true,
});

createSchema(database);
createChannelTable(database);
createBBCDatabase(database);

let commands = new Collection<
  string,
  (interaction: Interaction, database: Database) => Promise<void>
>();
commands.set(pingCommand.name, handlePingCommand);
commands.set(setChannelCommand.name, handleSetChannelCommand);
commands.set(votedCommand.name, handleVotedCommand);

client.once(Events.ClientReady, (readyClient) => {
  console.log("Logged in to discord as", readyClient.user.tag);
  client.user?.setActivity({
    name: "Watching incoming results | Run /channel to set result feed.",
  });

  Bun.cron("*/5 * * * *", async () => {
    console.log("Minute timer firing");
    await Promise.all([runDC(database, client), runBBC(database, client)]);
  });
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (
    (interaction.isContextMenuCommand() &&
      interaction.commandName == "Speak to Sandra") ||
    (interaction.isChatInputCommand() && interaction.commandName == "sandra")
  ) {
    try {
      await showModal(interaction);
    } catch (err) {
      console.error(err);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content:
            "Sandra message not submitted. Reason: There was an error while executing this command.",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content:
            "Sandra message not submitted. Reason: There was an error while executing this command.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
    return;
  }

  if (interaction.isModalSubmit() && interaction.customId == "sandra") {
    try {
      await handleModalResponse(interaction);
    } catch (err) {
      console.error(err);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error while executing this command.",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: "There was an error while executing this command.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;
  const command = commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command(interaction, database);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    }
  }
});

// Bun.cron("*/10 * * * 1,2,3", async () => {
//   console.log("Early-week timer firing");
//   await runDC(database, client);
// });

// Bun.cron("* * * * 4,5,6,7", async () => {
//   console.log("Late-week timer firing");
//   await runDC(database, client);
// });

client.login(process.env.DISCORD_TOKEN);

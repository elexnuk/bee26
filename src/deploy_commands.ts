import {
  Collection,
  REST,
  Routes,
  SharedSlashCommand,
  SlashCommandBuilder,
} from "discord.js";
import { pingCommand } from "./commands/ping";
import { setChannelCommand } from "./commands/set_channel";
import {
  messageCommand,
  slashCommand,
  userCommand,
} from "./commands/server/feedback";
import { votedCommand } from "./commands/server/voted";

let commands: object[] = [pingCommand.toJSON(), setChannelCommand.toJSON()];

const token = process.env.DISCORD_TOKEN;
if (!token) {
  throw "No token specified";
}

const clientId = process.env.DISCORD_CLIENT_ID;
if (!clientId) {
  throw "No client ID specified";
}

const guildId = process.env.MAIN_SERVER_ID;
if (!guildId) {
  throw "No guild ID specified";
}

const rest = new REST().setToken(token);

try {
  console.log(
    `Started refreshing ${commands.length} application (/) commands.`,
  );

  const data: any = await rest.put(Routes.applicationCommands(clientId), {
    body: commands,
  });

  await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
    body: [
      slashCommand.toJSON(),
      messageCommand.toJSON(),
      userCommand.toJSON(),
      votedCommand.toJSON(),
    ],
  });

  console.log(
    `Successfully reloaded ${data?.length} application (/) commands.`,
  );
} catch (error) {
  console.error(error);
}

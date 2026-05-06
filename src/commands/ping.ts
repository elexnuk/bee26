import {
  InteractionContextType,
  SlashCommandBuilder,
  type Interaction,
} from "discord.js";

import { Database } from "bun:sqlite";

export const pingCommand = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("pong")
  .setContexts(InteractionContextType.Guild);

export async function handlePingCommand(
  interaction: Interaction,
  _database: Database,
) {
  if (!interaction.isChatInputCommand()) {
    return;
  }
  await interaction.reply("Pong!");
}

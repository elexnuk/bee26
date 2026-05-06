import {
  ChannelType,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  SlashCommandChannelOption,
  type Interaction,
} from "discord.js";

import { Database } from "bun:sqlite";
import {
  AnnouncementChannel,
  setGuildAnnouncementChannel,
} from "../store/channels";

export const setChannelCommand = new SlashCommandBuilder()
  .setName("channel")
  .setDescription("Change the result announcement channel.")
  .addChannelOption(
    new SlashCommandChannelOption()
      .setName("channel")
      .setDescription("New channel for election announcements")
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .setContexts(InteractionContextType.Guild);

export async function handleSetChannelCommand(
  interaction: Interaction,
  database: Database,
) {
  if (!interaction.isChatInputCommand()) return;

  const channel = interaction.options.getChannel("channel");
  if (!channel) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "Unable to set channel: Invalid channel specified 'null'",
    });
    return;
  }

  if (!interaction.guild) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "Unable to set channel: Command must be run from a server.",
    });
    return;
  }

  if (
    channel.type != ChannelType.GuildText &&
    channel.type != ChannelType.GuildAnnouncement
  ) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content:
        "Unable to set channel: Invalid channel type. Allowed types: Text or Announcement, got: " +
        channel.type.toString(),
    });
    return;
  }

  const guild_id = interaction.guild.id;
  const channel_id = channel.id;
  try {
    setGuildAnnouncementChannel(
      database,
      new AnnouncementChannel(guild_id, channel_id),
    );
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "Set announcement channel to " + channel.toString(),
    });
  } catch (err) {
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: "Unable to set channel: Error in database operation.",
    });
  }
}

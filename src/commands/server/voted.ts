import {
  MessageFlags,
  SlashCommandBuilder,
  type Interaction,
} from "discord.js";

export const votedCommand = new SlashCommandBuilder()
  .setName("voted")
  .setDescription("✅ | Tell us you've voted!");

export async function handleVotedCommand(interaction: Interaction) {
  if (!interaction.isChatInputCommand() || !interaction.guild) {
    return;
  }

  const VOTING_STARTED = process.env.VOTING_STARTED;
  const VOTING_ENDED = process.env.VOTING_ENDED;
  const VOTED_ROLE_ID = process.env.VOTED_ROLE_ID;

  if (!VOTING_ENDED || !VOTING_STARTED || !VOTED_ROLE_ID) {
    throw "Please specify all voted role config";
  }

  const member = await interaction.guild.members.fetch(interaction.user.id);
  if (member.roles.cache.has(VOTED_ROLE_ID)) {
    await interaction.reply({
      content:
        "🗳️ | You've already told us you've voted! Keep an eye out for the results as they come in!",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  let currentTime = new Date();
  if (currentTime < new Date(VOTING_STARTED)) {
    await interaction.reply({
      content: " 🗳️ | Voting hasn't opened yet! Be patient!",
    });
    return;
  }

  if (currentTime > new Date(VOTING_ENDED)) {
    await interaction.reply({
      content:
        " 🗳️ | Voting has ended. You can no longer tell us you've voted. Keep an eye out for the results as they come in!",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Add the "I Voted" role to the user
  await interaction.guild.members.addRole({
    user: interaction.user.id,
    role: VOTED_ROLE_ID,
  });

  // Reply to the user
  await interaction.reply({
    content: " 🗳️ | <@" + member + "> has voted!",
  });
}

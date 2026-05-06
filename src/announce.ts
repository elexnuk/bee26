import {
  Client,
  GatewayIntentBits,
  ChannelType,
  TextChannel,
} from "discord.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once("clientReady", async () => {
  console.log(`Logged in as ${client.user?.tag}\n`);

  for (const guild of client.guilds.cache.values()) {
    console.log(`Guild: ${guild.id} (${guild.name})`);

    const channels = guild.channels.cache.filter(
      (channel) =>
        channel.type === ChannelType.GuildText &&
        (channel as TextChannel)
          .permissionsFor(guild.members.me!)
          ?.has("SendMessages"),
    );

    for (const channel of channels.values()) {
      console.log(`  ✓ #${channel.name}`);
    }

    console.log();
  }

  client.destroy();
});

client.login(process.env.DISCORD_TOKEN);

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
    let goodChannel = null;
    for (const channel of channels.values()) {
      if (goodChannel == null) {
        goodChannel = channel;
      } else if (channel.name == "general") {
        goodChannel = channel;
      }
      console.log(`  ✓ #${channel.name}`);
    }

    console.log(`   Good: ${goodChannel?.name} ${goodChannel?.id}`);
    if (!goodChannel || !goodChannel.isSendable()) {
      continue;
    }
    goodChannel
      .send(
        `Hello! This is the BEES Election Result service. This bot will shortly be coming online for the 2026 local elections. If you wish to receive live-ish results for this election please have an admin run the </channel:1501689600576323625> command to set-up the feed.

Note that there's approximately 5,000 results to be declared over the next few days so this channel might get spammed by the bot quite a bit.

If you don't wish to receive any results, no worries, you don't need to do anything.

Any issues or questions please reach out to <@125210971642789891> or on the Britain Elects discord. Thanks.
`,
      )
      .then(() => console.log("sent"))
      .catch((err) => console.error);

    console.log();
  }

  client.destroy();
});

client.login(process.env.DISCORD_TOKEN);

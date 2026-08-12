const { EmbedBuilder } = require('discord.js');
const { getGuild } = require('./storage');

async function sendLog(client, guild, title, desc, color) {
  const cfg = getGuild(guild.id);
  if (!cfg.logChannel) return;
  const ch = await guild.channels.fetch(cfg.logChannel).catch(() => null);
  if (!ch) return;
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(desc)
    .setColor(color || 0x5865f2)
    .setTimestamp();
  await ch.send({ embeds: [embed] }).catch(() => {});
}

module.exports = { sendLog };

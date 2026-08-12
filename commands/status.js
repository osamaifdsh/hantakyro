const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getGuild } = require('../handlers/storage');
const { canManage } = require('../handlers/auth');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('🛡️ عرض حالة الحماية على هذا السيرفر'),

  async execute(interaction, client) {
    if (!canManage(interaction, client)) {
      return interaction.reply({ content: '❌ You need **Manage Server** permission.', ephemeral: true });
    }
    const cfg = getGuild(interaction.guild.id);
    const p = cfg.protection;

    const lines = Object.entries(p)
      .filter(([k]) => k !== 'enabled')
      .map(([k, v]) => `${v ? '🟢' : '🔴'} ${k}`)
      .join('\n');

    const embed = new EmbedBuilder()
      .setTitle('🛡️ Hantakyro — Status')
      .setDescription(
        `**Protection:** ${p.enabled ? '🟢 ACTIVE' : '🔴 OFF'}\n` +
          `**Punishment mode:** ${cfg.punish}\n` +
          `**Whitelisted users:** ${cfg.whitelist.length}\n` +
          `**Raid mode:** ${cfg.raidMode ? '🔴 LOCKED DOWN' : '🟢 Normal'}\n` +
          `**Log channel:** ${cfg.logChannel ? `<#${cfg.logChannel}>` : 'not set'}\n\n` +
          `**Modules:**\n${lines}`
      )
      .setColor(0x5865f2)
      .setFooter({ text: 'Hantakyro — The Strongest Protection Bot' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};

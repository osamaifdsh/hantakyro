const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getGuild, saveGuild } = require('../handlers/storage');
const { canManage } = require('../handlers/auth');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('en_safe')
    .setDescription('🛡️ تفعيل الحماية الكاملة على السيرفر')
    .addChannelOption((o) => o.setName('log_channel').setDescription('قناة سجلات الحماية (اختياري)').setRequired(false)),

  async execute(interaction, client) {
    if (!canManage(interaction, client)) {
      return interaction.reply({ content: '❌ You need **Manage Server** permission.', ephemeral: true });
    }

    const cfg = getGuild(interaction.guild.id);
    for (const k of Object.keys(cfg.protection)) cfg.protection[k] = true;
    cfg.protection.enabled = true;
    if (!cfg.punish) cfg.punish = 'ban';
    const ch = interaction.options.getChannel('log_channel');
    if (ch && ch.type === 0) cfg.logChannel = ch.id;
    saveGuild(interaction.guild.id, cfg);

    const embed = new EmbedBuilder()
      .setTitle('🛡️ Hantakyro Protection is now ACTIVE')
      .setDescription(
        'Full protection is enabled on this server.\n\n' +
          '• Anyone who bans, kicks, deletes channels/roles or does anything harmful will be **punished automatically**.\n' +
          '• Users on the whitelist (**/list**) are always safe.\n' +
          '• Logs channel: ' + (cfg.logChannel ? `<#${cfg.logChannel}>` : 'not set — use **/log_channel**')
      )
      .setColor(0x00ff88)
      .setFooter({ text: 'Hantakyro — The Strongest Protection Bot' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};

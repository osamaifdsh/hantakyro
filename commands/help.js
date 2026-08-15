const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('help').setDescription('📖 عرض كل أوامر Hantakyro'),

  async execute(interaction, client) {
    const embed = new EmbedBuilder()
      .setTitle('🛡️ Hantakyro Commands')
      .setColor(0x5865f2)
      .setDescription(
          '**Protection:**\n' +
          '`/en_safe` — Activate full protection\n' +
          '`/status` — Show protection status\n' +
          '`/protection` — Toggle a module\n' +
          '`/punish` — Set punishment mode (ban/kick/strip)\n' +
          '`/log_channel` — Set logs channel\n\n' +
          '**Whitelist (safe list):**\n' +
          '`/list @user` — Protect a user from punishments\n' +
          '`/unlist @user` — Remove a user from the safe list\n\n' +
          '**Security tools:**\n' +
          '`/lockdown` — Lock / restore the server during raids\n' +
          '`/purge` — Delete messages\n' +
          '`/unban` — Unban a user\n' +
          '`/logs` — Show recent protection actions\n\n' +
          '**Community:**\n' +
          '`/welcome` — Welcome message on join\n' +
          '`/goodbye` — Goodbye message on leave\n' +
          '`/autorole` — Auto role for new members\n' +
          '`/announce` — Send an official announcement\n\n' +
          '**Info:**\n' +
          '`/botinfo` — Bot status, servers, uptime\n' +
          '`/serverinfo` — Server info\n' +
          '`/userinfo` — User info\n' +
          '`/members` — Member statistics\n' +
          '`/avatar` — View an avatar\n' +
          '`/ping` — Check bot latency\n\n' +
          '**Dashboard:** open `http://localhost:3000` (password in config.json)'
      )
      .setFooter({ text: 'Hantakyro — The Strongest Protection Bot' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};

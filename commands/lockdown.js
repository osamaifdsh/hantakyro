const { SlashCommandBuilder } = require('discord.js');
const { getGuild, saveGuild } = require('../handlers/storage');
const { canManage } = require('../handlers/auth');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lockdown')
    .setDescription('🛡️ قفل / فتح السيرفر أثناء الريد')
    .addBooleanOption((o) => o.setName('state').setDescription('ON = قفل السيرفر، OFF = استرجاعه').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('سبب القفل (اختياري)')),

  async execute(interaction, client) {
    if (!canManage(interaction, client)) {
      return interaction.reply({ content: '❌ You need **Manage Server** permission.', ephemeral: true });
    }
    const state = interaction.options.getBoolean('state');
    const reason = interaction.options.getString('reason');
    const guild = interaction.guild;
    const cfg = getGuild(guild.id);

    if (state) {
      cfg.raidMode = true;
      cfg.previousVerification = guild.verificationLevel;
      await guild.setVerificationLevel(2).catch(() => {});
      await guild.roles.everyone
        .setPermissions(guild.roles.everyone.permissions.remove(1024))
        .catch(() => {});
      saveGuild(guild.id, cfg);
      return interaction.reply({
        content:
          `🔴 **LOCKDOWN ENABLED** — verification HIGH + chat locked.` +
          (reason ? `\n📌 Reason: **${reason}**` : '') +
          `\nاستخدم \`/lockdown state:false\` لاسترجاع السيرفر.`,
        ephemeral: true
      });
    } else {
      cfg.raidMode = false;
      await guild.setVerificationLevel(cfg.previousVerification || 0).catch(() => {});
      await guild.roles.everyone
        .setPermissions(guild.roles.everyone.permissions.add(1024))
        .catch(() => {});
      saveGuild(guild.id, cfg);
      return interaction.reply({
        content: '🟢 **LOCKDOWN OFF** — server restored to normal.',
        ephemeral: true
      });
    }
  }
};

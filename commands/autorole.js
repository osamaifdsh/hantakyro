const { SlashCommandBuilder } = require('discord.js');
const { getGuild, saveGuild } = require('../handlers/storage');
const { canManage } = require('../handlers/auth');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('🎖️ رتبة تُمنح تلقائياً لأي عضو جديد')
    .addSubcommand((s) =>
      s
        .setName('add')
        .setDescription('إضافة رتبة تلقائية')
        .addRoleOption((o) => o.setName('role').setDescription('الرتبة').setRequired(true))
    )
    .addSubcommand((s) =>
      s
        .setName('remove')
        .setDescription('حذف رتبة تلقائية')
        .addRoleOption((o) => o.setName('role').setDescription('الرتبة').setRequired(true))
    )
    .addSubcommand((s) => s.setName('list').setDescription('عرض الرتب التلقائية'))
    .addSubcommand((s) => s.setName('off').setDescription('إيقاف الرتب التلقائية بالكامل')),

  async execute(interaction, client) {
    if (!canManage(interaction, client)) {
      return interaction.reply({ content: '❌ You need **Manage Server** permission.', ephemeral: true });
    }
    const cfg = getGuild(interaction.guild.id);
    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const role = interaction.options.getRole('role');
      if (!role || role.id === interaction.guild.id) {
        return interaction.reply({ content: '❌ لا يمكن إضافة رتبة @everyone.', ephemeral: true });
      }
      if (cfg.autorole.roleIds.includes(role.id)) {
        return interaction.reply({ content: `ℹ️ الرتبة **${role.name}** موجودة مسبقاً.`, ephemeral: true });
      }
      cfg.autorole.roleIds.push(role.id);
      cfg.autorole.enabled = true;
      saveGuild(interaction.guild.id, cfg);
      return interaction.reply({
        content: `✅ رتبة **${role.name}** ستُمنح تلقائياً للأعضاء الجدد.`,
        ephemeral: true
      });
    }

    if (sub === 'remove') {
      const role = interaction.options.getRole('role');
      cfg.autorole.roleIds = cfg.autorole.roleIds.filter((id) => id !== role.id);
      if (!cfg.autorole.roleIds.length) cfg.autorole.enabled = false;
      saveGuild(interaction.guild.id, cfg);
      return interaction.reply({ content: `❌ تمت إزالة رتبة **${role.name}**.`, ephemeral: true });
    }

    if (sub === 'off') {
      cfg.autorole.enabled = false;
      saveGuild(interaction.guild.id, cfg);
      return interaction.reply({ content: '❌ الرتب التلقائية موقفة.', ephemeral: true });
    }

    if (sub === 'list') {
      const names = cfg.autorole.roleIds
        .map((id) => interaction.guild.roles.cache.get(id)?.name || id)
        .map((n) => `• ${n}`)
        .join('\n');
      return interaction.reply({
        content:
          `**Autorole:** ${cfg.autorole.enabled ? '🟢 ON' : '🔴 OFF'}\n` +
          `**Roles (${cfg.autorole.roleIds.length}):**\n${names || 'لا توجد رتب.'}`,
        ephemeral: true
      });
    }

    return interaction.reply({ content: '⚠️ أمر غير معروف.', ephemeral: true });
  }
};

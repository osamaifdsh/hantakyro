const { SlashCommandBuilder } = require('discord.js');
const { getGuild, saveGuild } = require('../handlers/storage');
const { canManage } = require('../handlers/auth');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('punish')
    .setDescription('🛡️ طريقة معاقبة المخالفين')
    .addStringOption((o) =>
      o
        .setName('mode')
        .setDescription('طريقة العقاب')
        .setRequired(true)
        .addChoices(
          { name: 'Ban (strongest)', value: 'ban' },
          { name: 'Kick', value: 'kick' },
          { name: 'Strip all roles', value: 'strip' }
        )
    ),

  async execute(interaction, client) {
    if (!canManage(interaction, client)) {
      return interaction.reply({ content: '❌ You need **Manage Server** permission.', ephemeral: true });
    }
    const mode = interaction.options.getString('mode');
    const cfg = getGuild(interaction.guild.id);
    const old = cfg.punish;
    cfg.punish = mode;
    saveGuild(interaction.guild.id, cfg);
    const labels = { ban: '🚫 Ban', kick: '👢 Kick', strip: '🎭 Strip roles' };
    return interaction.reply({
      content: `✅ Punishment mode updated:\n**${labels[old] || old}** → **${labels[mode]}**`,
      ephemeral: true
    });
  }
};

const { SlashCommandBuilder } = require('discord.js');
const { getGuild, saveGuild } = require('../handlers/storage');
const { canManage } = require('../handlers/auth');

const features = [
  ['antiBan', 'Anti Ban'],
  ['antiKick', 'Anti Kick'],
  ['antiBotAdd', 'Anti Bot Add'],
  ['antiChannelCreate', 'Anti Channel Create'],
  ['antiChannelDelete', 'Anti Channel Delete'],
  ['antiChannelUpdate', 'Anti Channel Update'],
  ['antiRoleCreate', 'Anti Role Create'],
  ['antiRoleDelete', 'Anti Role Delete'],
  ['antiRoleUpdate', 'Anti Role Update'],
  ['antiWebhook', 'Anti Webhook'],
  ['antiGuildUpdate', 'Anti Guild Update'],
  ['antiEmoji', 'Anti Emoji'],
  ['antiRaid', 'Anti Raid'],
  ['antiSpam', 'Anti Spam'],
  ['antiEveryone', 'Anti Everyone Ping'],
  ['antiLink', 'Anti Link'],
  ['antiMention', 'Anti Mass Mention']
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('protection')
    .setDescription('🛡️ تفعيل / إيقاف موديول حماية معين')
    .addStringOption((o) =>
      o
        .setName('module')
        .setDescription('أي موديول حماية')
        .setRequired(true)
        .addChoices(...features.map(([k, label]) => ({ name: label, value: k })))
    )
    .addBooleanOption((o) => o.setName('state').setDescription('ON / OFF').setRequired(true)),

  async execute(interaction, client) {
    if (!canManage(interaction, client)) {
      return interaction.reply({ content: '❌ You need **Manage Server** permission.', ephemeral: true });
    }
    const cfg = getGuild(interaction.guild.id);
    if (!cfg.protection.enabled) {
      return interaction.reply({ content: '⚠️ Protection is OFF. Use **/en_safe** first.', ephemeral: true });
    }
    const feature = interaction.options.getString('module');
    const state = interaction.options.getBoolean('state');
    cfg.protection[feature] = state;
    saveGuild(interaction.guild.id, cfg);
    return interaction.reply({
      content: `${state ? '✅' : '❌'} **${feature}** is now **${state ? 'ON' : 'OFF'}**.`,
      ephemeral: true
    });
  }
};

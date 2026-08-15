const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { getGuild, saveGuild } = require('../handlers/storage');
const { canManage } = require('../handlers/auth');

function fill(template, guild, name) {
  return (template || 'Goodbye {user}, see you soon!')
    .replace(/\{username\}/g, name)
    .replace(/\{server\}/g, guild.name)
    .replace(/\{count\}/g, guild.memberCount);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('goodbye')
    .setDescription('👋 إعداد رسالة الوداع عند مغادرة عضو')
    .addSubcommand((s) => s.setName('on').setDescription('تفعيل رسالة الوداع'))
    .addSubcommand((s) => s.setName('off').setDescription('إيقاف رسالة الوداع'))
    .addSubcommand((s) =>
      s
        .setName('set')
        .setDescription('تحديد قناة الوداع والرسالة')
        .addChannelOption((o) =>
          o.setName('channel').setDescription('قناة الوداع').setRequired(true).addChannelTypes(ChannelType.GuildText)
        )
        .addStringOption((o) =>
          o
            .setName('message')
            .setDescription('الرسالة — رموز: {username} {server} {count}')
            .setRequired(false)
        )
    )
    .addSubcommand((s) => s.setName('test').setDescription('إرسال رسالة وداع تجريبية')),

  async execute(interaction, client) {
    if (!canManage(interaction, client)) {
      return interaction.reply({ content: '❌ You need **Manage Server** permission.', ephemeral: true });
    }
    const cfg = getGuild(interaction.guild.id);
    const sub = interaction.options.getSubcommand();

    if (sub === 'on') {
      if (!cfg.goodbye.channelId) {
        return interaction.reply({ content: '⚠️ حدد قناة أولاً باستخدام **/goodbye set**.', ephemeral: true });
      }
      cfg.goodbye.enabled = true;
      saveGuild(interaction.guild.id, cfg);
      return interaction.reply({ content: `✅ رسالة الوداع مفعلة في <#${cfg.goodbye.channelId}>.`, ephemeral: true });
    }

    if (sub === 'off') {
      cfg.goodbye.enabled = false;
      saveGuild(interaction.guild.id, cfg);
      return interaction.reply({ content: '❌ رسالة الوداع موقفة.', ephemeral: true });
    }

    if (sub === 'set') {
      cfg.goodbye.channelId = interaction.options.getChannel('channel').id;
      const msg = interaction.options.getString('message');
      if (msg) cfg.goodbye.message = msg;
      cfg.goodbye.enabled = true;
      saveGuild(interaction.guild.id, cfg);
      return interaction.reply({
        content: `✅ الوداع مفعل في <#${cfg.goodbye.channelId}>.`,
        ephemeral: true
      });
    }

    if (sub === 'test') {
      const target = cfg.goodbye.channelId || interaction.channel.id;
      const ch = await interaction.guild.channels.fetch(target).catch(() => null);
      if (!ch) return interaction.reply({ content: '⚠️ القناة غير موجودة.', ephemeral: true });
      await ch.send(fill(cfg.goodbye.message, interaction.guild, 'testuser')).catch(() => {});
      return interaction.reply({ content: '👋 تم إرسال رسالة تجريبية.', ephemeral: true });
    }

    return interaction.reply({ content: '⚠️ أمر غير معروف.', ephemeral: true });
  }
};

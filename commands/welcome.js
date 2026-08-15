const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { getGuild, saveGuild } = require('../handlers/storage');
const { canManage } = require('../handlers/auth');

function fill(template, guild, member) {
  return (template || 'Welcome {user} to {server}!')
    .replace(/\{user\}/g, `<@${member.id}>`)
    .replace(/\{username\}/g, member.user.username)
    .replace(/\{server\}/g, guild.name)
    .replace(/\{count\}/g, guild.memberCount);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('👋 إعداد رسالة الترحيب للعضو الجديد')
    .addSubcommand((s) => s.setName('on').setDescription('تفعيل رسالة الترحيب'))
    .addSubcommand((s) => s.setName('off').setDescription('إيقاف رسالة الترحيب'))
    .addSubcommand((s) =>
      s
        .setName('set')
        .setDescription('تحديد قناة الترحيب والرسالة')
        .addChannelOption((o) =>
          o.setName('channel').setDescription('قناة الترحيب').setRequired(true).addChannelTypes(ChannelType.GuildText)
        )
        .addStringOption((o) =>
          o
            .setName('message')
            .setDescription('الرسالة — رموز: {user} {username} {server} {count}')
            .setRequired(false)
        )
    )
    .addSubcommand((s) => s.setName('test').setDescription('إرسال رسالة ترحيب تجريبية')),

  async execute(interaction, client) {
    if (!canManage(interaction, client)) {
      return interaction.reply({ content: '❌ You need **Manage Server** permission.', ephemeral: true });
    }
    const cfg = getGuild(interaction.guild.id);
    const sub = interaction.options.getSubcommand();

    if (sub === 'on') {
      if (!cfg.welcome.channelId) {
        return interaction.reply({ content: '⚠️ حدد قناة أولاً باستخدام **/welcome set**.', ephemeral: true });
      }
      cfg.welcome.enabled = true;
      saveGuild(interaction.guild.id, cfg);
      return interaction.reply({ content: `✅ رسالة الترحيب مفعلة في <#${cfg.welcome.channelId}>.`, ephemeral: true });
    }

    if (sub === 'off') {
      cfg.welcome.enabled = false;
      saveGuild(interaction.guild.id, cfg);
      return interaction.reply({ content: '❌ رسالة الترحيب موقفة.', ephemeral: true });
    }

    if (sub === 'set') {
      cfg.welcome.channelId = interaction.options.getChannel('channel').id;
      const msg = interaction.options.getString('message');
      if (msg) cfg.welcome.message = msg;
      cfg.welcome.enabled = true;
      saveGuild(interaction.guild.id, cfg);
      return interaction.reply({
        content: `✅ الترحيب مفعل في <#${cfg.welcome.channelId}>.`,
        ephemeral: true
      });
    }

    if (sub === 'test') {
      const target = cfg.welcome.channelId || interaction.channel.id;
      const ch = await interaction.guild.channels.fetch(target).catch(() => null);
      if (!ch) return interaction.reply({ content: '⚠️ القناة غير موجودة.', ephemeral: true });
      await ch.send(fill(cfg.welcome.message, interaction.guild, interaction.member)).catch(() => {});
      return interaction.reply({ content: '👋 تم إرسال رسالة تجريبية.', ephemeral: true });
    }

    return interaction.reply({ content: '⚠️ أمر غير معروف.', ephemeral: true });
  }
};

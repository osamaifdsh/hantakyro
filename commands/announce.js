const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const { canManage } = require('../handlers/auth');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('📢 إرسال إعلان رسمي')
    .addStringOption((o) => o.setName('message').setDescription('نص الإعلان').setRequired(true))
    .addChannelOption((o) =>
      o.setName('channel').setDescription('القناة (اختياري — الافتراضي القناة الحالية)').addChannelTypes(ChannelType.GuildText)
    ),

  async execute(interaction, client) {
    if (!canManage(interaction, client)) {
      return interaction.reply({ content: '❌ You need **Manage Server** permission.', ephemeral: true });
    }
    const msg = interaction.options.getString('message');
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    const embed = new EmbedBuilder()
      .setTitle('📢 Announcement')
      .setDescription(msg)
      .setColor(0x5865f2)
      .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL({ size: 64 }) })
      .setTimestamp();

    await channel.send({ embeds: [embed] }).catch(() => {});
    return interaction.reply({
      content: `✅ تم إرسال الإعلان إلى ${channel}.`,
      ephemeral: true
    });
  }
};

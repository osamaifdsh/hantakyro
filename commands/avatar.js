const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('🖼️ عرض صورة بروفايل مستخدم')
    .addUserOption((o) => o.setName('user').setDescription('المستخدم (اختياري)')),

  async execute(interaction, client) {
    const target = interaction.options.getUser('user') || interaction.user;

    const embed = new EmbedBuilder()
      .setTitle(`🖼️ ${target.tag}`)
      .setColor(0x5865f2)
      .setImage(target.displayAvatarURL({ size: 1024 }));

    return interaction.reply({ embeds: [embed] });
  }
};

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('👤 معلومات مستخدم')
    .addUserOption((o) => o.setName('user').setDescription('المستخدم (اختياري)')),

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;

    const embed = new EmbedBuilder()
      .setTitle(`👤 ${target.tag}`)
      .setColor(0x5865f2)
      .setThumbnail(target.displayAvatarURL({ size: 256 }))
      .setDescription(
        `**ID:** ${target.id}\n` +
          `**Bot:** ${target.bot ? 'Yes' : 'No'}\n` +
          `**Account created:** <t:${Math.floor(target.createdTimestamp / 1000)}:R>`
      )
      .setFooter({ text: 'Hantakyro — The Strongest Protection Bot' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};

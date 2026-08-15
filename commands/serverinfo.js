const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('serverinfo').setDescription('📊 معلومات هذا السيرفر'),

  async execute(interaction) {
    const g = interaction.guild;
    const owner = await g.fetchOwner();

    const embed = new EmbedBuilder()
      .setTitle(`📊 ${g.name}`)
      .setColor(0x5865f2)
      .setThumbnail(g.iconURL({ size: 256 }))
      .setDescription(
        `**Owner:** ${owner.user.tag}\n` +
          `**Members:** ${g.memberCount}\n` +
          `**Channels:** ${g.channels.cache.size}\n` +
          `**Roles:** ${g.roles.cache.size}\n` +
          `**Emojis:** ${g.emojis.cache.size}\n` +
          `**Boost level:** ${g.premiumTier} (${g.premiumSubscriptionCount} boosts)\n` +
          `**Created:** <t:${Math.floor(g.createdTimestamp / 1000)}:R>`
      )
      .setFooter({ text: 'Hantakyro — The Strongest Protection Bot' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};

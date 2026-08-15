const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('members').setDescription('👥 إحصائيات أعضاء هذا السيرفر'),

  async execute(interaction, client) {
    const g = interaction.guild;
    await g.members.fetch().catch(() => {});

    const members = g.members.cache;
    const humans = members.filter((m) => !m.user.bot).size;
    const bots = members.filter((m) => m.user.bot).size;
    const online = members.filter((m) => m.presence && m.presence.status !== 'offline').size;
    const dnd = members.filter((m) => m.presence && m.presence.status === 'dnd').size;
    const idle = members.filter((m) => m.presence && m.presence.status === 'idle').size;

    const embed = new EmbedBuilder()
      .setTitle(`👥 ${g.name} — Members`)
      .setColor(0x5865f2)
      .setDescription(
        `**Total:** ${g.memberCount}\n` +
          `**Humans:** ${humans}\n` +
          `**Bots:** ${bots}\n` +
          `**Online now:** ${online}\n` +
          `**Idle:** ${idle}\n` +
          `**DND:** ${dnd}`
      )
      .setFooter({ text: 'Hantakyro — The Strongest Protection Bot' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};

const config = require('./config');
const { PermissionFlagsBits } = require('discord.js');

function canManage(interaction, client) {
  if (config.owners && config.owners.includes(interaction.user.id)) return true;
  const member = interaction.member;
  if (!member || !member.permissions) return false;
  return (
    member.permissions.has(PermissionFlagsBits.ManageGuild) ||
    member.permissions.has(PermissionFlagsBits.Administrator)
  );
}

module.exports = { canManage };

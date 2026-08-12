const { getGuild, addLog } = require('./storage');
const { markBotAction } = require('./state');

async function punishUser(client, guild, user, reason) {
  const cfg = getGuild(guild.id);
  const mode = cfg.punish || 'ban';
  const tag = user.tag || user.username || user.id;
  let executed = false;

  if (mode === 'strip') {
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (member) {
      const roles = member.roles.cache.filter((r) => r.id !== guild.id);
      if (roles.size) {
        await member.roles.remove(roles).catch(() => {});
        executed = true;
      }
    }
  } else if (mode === 'kick') {
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (member) {
      await member.kick(reason).catch(() => {});
      executed = true;
    }
  } else {
    await guild.bans.create(user.id, { reason }).catch(() => {});
    executed = true;
  }

  markBotAction(mode === 'kick' ? `kick:${guild.id}:${user.id}` : `ban:${guild.id}:${user.id}`);
  addLog(guild.id, { action: mode, target: tag, reason, by: 'Hantakyro' });
  return { executed, mode, target: tag };
}

module.exports = { punishUser };

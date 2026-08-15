const { AuditLogEvent, Events, PermissionFlagsBits } = require('discord.js');
const config = require('./config');
const { getGuild, saveGuild, addLog, saveSnapshot, getSnapshot, deleteSnapshot } = require('./storage');
const { punishUser } = require('./punish');
const { isBotAction, markBotAction, joinTracker, raidTracker } = require('./state');
const { sendLog } = require('./logging');

function isSafe(guild, user) {
  if (!user) return false;
  const cfg = getGuild(guild.id);
  if (config.owners && config.owners.includes(user.id)) return true;
  if (cfg.whitelist.includes(user.id)) return true;
  if (guild.ownerId === user.id) return true;
  const member = guild.members.cache.get(user.id);
  if (member && member.roles.cache.some((r) => cfg.whitelistRoles.includes(r.id))) return true;
  return false;
}

function featureOn(guild, feature) {
  const cfg = getGuild(guild.id);
  return cfg.protection.enabled && cfg.protection[feature] !== false;
}

async function getExecutor(guild, type) {
  try {
    const logs = await guild.fetchAuditLogs({ type, limit: 1 });
    const entry = logs.entries.first();
    if (!entry) return null;
    if (Date.now() - entry.createdTimestamp > 8000) return null;
    return { user: entry.executor, target: entry.target };
  } catch {
    return null;
  }
}

async function enforce(client, guild, feature, executor, reason) {
  if (!featureOn(guild, feature)) return;
  if (!executor) return;
  if (executor.id === client.user.id) return;
  if (isSafe(guild, executor)) return;
  const res = await punishUser(client, guild, executor, reason);
  await sendLog(
    client,
    guild,
    `🛡️ ${feature}`,
    `**${executor.tag || executor.id}**\n${reason}\n\nPunishment: **${res.mode}**`,
    0xff3b3b
  );
  addLog(guild.id, { action: feature, target: reason, by: executor.tag || executor.id });
}

async function onBanAdd(client, guild, victim) {
  if (!featureOn(guild, 'antiBan')) return;
  const key = `ban:${guild.id}:${victim.id}`;
  if (isBotAction(key)) return;
  const info = await getExecutor(guild, AuditLogEvent.MEMBER_BAN_ADD);
  if (!info || !info.user) return;
  const actor = info.user;
  if (actor.id === client.user.id) return;
  if (isSafe(guild, actor)) return;
  await punishUser(client, guild, actor, `Anti-Ban | tried to ban ${victim.tag || victim.id}`);
  if (!isSafe(guild, victim)) {
    await guild.bans.remove(victim.id, 'Hantakyro Anti-Ban restore').catch(() => {});
    markBotAction(`unban:${guild.id}:${victim.id}`);
  }
  await sendLog(
    client,
    guild,
    '🛡️ Anti-Ban',
    `**${actor.tag || actor.id}** tried to ban **${victim.tag || victim.id}**\nThey have been punished and the victim restored.`,
    0xff3b3b
  );
}

async function onMemberRemove(client, guild, member) {
  const cfg = getGuild(guild.id);

  if (cfg.goodbye && cfg.goodbye.enabled && cfg.goodbye.channelId) {
    const ch = await guild.channels.fetch(cfg.goodbye.channelId).catch(() => null);
    if (ch) {
      const name = member.user ? member.user.username : 'member';
      const text = (cfg.goodbye.message || 'Goodbye {user}, see you soon!')
        .replace(/\{user\}/g, member.user ? `<@${member.user.id}>` : '')
        .replace(/\{username\}/g, name)
        .replace(/\{server\}/g, guild.name)
        .replace(/\{count\}/g, guild.memberCount);
      await ch.send(text).catch(() => {});
    }
  }

  if (!featureOn(guild, 'antiKick')) return;
  const key = `kick:${guild.id}:${member.id}`;
  if (isBotAction(key)) return;
  const info = await getExecutor(guild, AuditLogEvent.MEMBER_KICK);
  if (!info || !info.user) return;
  const actor = info.user;
  if (actor.id === client.user.id) return;
  if (isSafe(guild, actor)) return;
  await punishUser(client, guild, actor, `Anti-Kick | kicked ${member.user?.tag || member.id}`);
  await sendLog(
    client,
    guild,
    '🛡️ Anti-Kick',
    `**${actor.tag || actor.id}** kicked **${member.user?.tag || member.id}** → they have been punished.`,
    0xff3b3b
  );
}

async function onMemberAdd(client, guild, member) {
  const cfg = getGuild(guild.id);

  if (cfg.welcome && cfg.welcome.enabled && cfg.welcome.channelId) {
    const ch = await guild.channels.fetch(cfg.welcome.channelId).catch(() => null);
    if (ch) {
      const text = (cfg.welcome.message || 'Welcome {user} to {server}!')
        .replace(/\{user\}/g, `<@${member.id}>`)
        .replace(/\{username\}/g, member.user.username)
        .replace(/\{server\}/g, guild.name)
        .replace(/\{count\}/g, guild.memberCount);
      await ch.send(text).catch(() => {});
    }
  }

  if (cfg.autorole && cfg.autorole.enabled && cfg.autorole.roleIds && cfg.autorole.roleIds.length) {
    for (const roleId of cfg.autorole.roleIds) {
      const role = guild.roles.cache.get(roleId);
      if (role && role.editable) {
        await member.roles.add(roleId, 'Hantakyro auto-role').catch(() => {});
      }
    }
  }

  if (!cfg.protection.enabled) return;

  if (member.user.bot && featureOn(guild, 'antiBotAdd')) {
    const info = await getExecutor(guild, AuditLogEvent.BOT_ADD);
    if (info && info.user && !isSafe(guild, info.user)) {
      await member.kick('Hantakyro Anti-Bot-Add').catch(() => {});
      markBotAction(`kick:${guild.id}:${member.id}`);
      await punishUser(client, guild, info.user, `Anti-Bot-Add | added bot ${member.user.tag}`);
      await sendLog(
        client,
        guild,
        '🤖 Anti-Bot-Add',
        `**${info.user.tag || info.user.id}** tried to add a bot (${member.user.tag}) → punished & bot removed.`,
        0xff3b3b
      );
      return;
    }
  }

  if (featureOn(guild, 'antiRaid')) {
    const now = Date.now();
    let arr = raidTracker.get(guild.id) || [];
    arr = arr.filter((t) => now - t < cfg.raidWindow);
    arr.push(now);
    raidTracker.set(guild.id, arr);

    if (arr.length >= cfg.raidThreshold && !cfg.raidMode) {
      cfg.raidMode = true;
      cfg.previousVerification = guild.verificationLevel;
      await guild.setVerificationLevel(2).catch(() => {});
      await guild.roles.everyone
        .setPermissions(guild.roles.everyone.permissions.remove(PermissionFlagsBits.SendMessages))
        .catch(() => {});
      saveGuild(guild.id, cfg);
      addLog(guild.id, { action: 'antiRaid', target: 'raid detected', reason: `Lockdown enabled` });
      await sendLog(
        client,
        guild,
        '🚨 RAID DETECTED',
        `More than **${cfg.raidThreshold}** joins in **${cfg.raidWindow / 1000}s**.\nServer is now in **lockdown** (verification HIGH + chat locked).\nUse **/lockdown off** to restore the server.`,
        0xff9900
      );
    }

    if (cfg.raidMode && !isSafe(guild, member.user)) {
      const m = await guild.members.fetch(member.id).catch(() => null);
      if (m && m.joinedTimestamp && now - m.joinedTimestamp < 60000) {
        await m.kick('Hantakyro Raid protection').catch(() => {});
        markBotAction(`kick:${guild.id}:${member.id}`);
      }
    }
  }
}

async function onChannelCreate(client, channel) {
  if (!channel.guild) return;
  saveSnapshot(channel.guild.id, 'channel', channel.id, {
    type: channel.type,
    name: channel.name,
    topic: channel.topic,
    nsfw: channel.nsfw,
    parentId: channel.parentId,
    position: channel.position,
    overwrites: channel.permissionOverwrites.cache.map((o) => ({
      id: o.id,
      type: o.type,
      allow: o.allow.bitfield,
      deny: o.deny.bitfield
    }))
  });
  const info = await getExecutor(channel.guild, AuditLogEvent.CHANNEL_CREATE);
  await enforce(client, channel.guild, 'antiChannelCreate', info?.user, `Created channel #${channel.name}`);
}

async function onChannelDelete(client, channel) {
  if (!channel.guild) return;
  const info = await getExecutor(channel.guild, AuditLogEvent.CHANNEL_DELETE);
  await enforce(client, channel.guild, 'antiChannelDelete', info?.user, `Deleted channel #${channel.name}`);
  if (featureOn(channel.guild, 'antiChannelDelete')) {
    const snap = getSnapshot(channel.guild.id, 'channel', channel.id);
    if (snap) {
      const created = await channel.guild.channels
        .create({
          name: snap.name,
          type: snap.type,
          topic: snap.topic,
          nsfw: snap.nsfw,
          parent: snap.parentId,
          position: snap.position
        })
        .catch(() => null);
      if (created) {
        if (snap.overwrites && snap.overwrites.length) {
          await created.permissionOverwrites.set(snap.overwrites).catch(() => {});
        }
        await sendLog(client, channel.guild, '🔧 Channel Restored', `**#${snap.name}** was deleted → recreated by Hantakyro.`, 0x22c55e);
      }
      deleteSnapshot(channel.guild.id, 'channel', channel.id);
    }
  }
}

async function onChannelUpdate(client, channel) {
  if (!channel.guild) return;
  const info = await getExecutor(channel.guild, AuditLogEvent.CHANNEL_UPDATE);
  await enforce(client, channel.guild, 'antiChannelUpdate', info?.user, `Modified channel #${channel.name}`);
}

async function onRoleCreate(client, role) {
  if (!role.guild) return;
  saveSnapshot(role.guild.id, 'role', role.id, {
    name: role.name,
    color: role.color,
    hoist: role.hoist,
    mentionable: role.mentionable,
    permissions: role.permissions.bitfield,
    position: role.position
  });
  const info = await getExecutor(role.guild, AuditLogEvent.ROLE_CREATE);
  await enforce(client, role.guild, 'antiRoleCreate', info?.user, `Created role ${role.name}`);
}

async function onRoleDelete(client, role) {
  if (!role.guild) return;
  const info = await getExecutor(role.guild, AuditLogEvent.ROLE_DELETE);
  await enforce(client, role.guild, 'antiRoleDelete', info?.user, `Deleted role ${role.name}`);
  if (featureOn(role.guild, 'antiRoleDelete')) {
    const snap = getSnapshot(role.guild.id, 'role', role.id);
    if (snap) {
      const created = await role.guild.roles
        .create({
          name: snap.name,
          color: snap.color,
          hoist: snap.hoist,
          mentionable: snap.mentionable,
          permissions: snap.permissions,
          position: snap.position
        })
        .catch(() => null);
      if (created) {
        await sendLog(client, role.guild, '🔧 Role Restored', `Role **${snap.name}** was deleted → recreated by Hantakyro.`, 0x22c55e);
      }
      deleteSnapshot(role.guild.id, 'role', role.id);
    }
  }
}

async function onRoleUpdate(client, role) {
  if (!role.guild) return;
  const info = await getExecutor(role.guild, AuditLogEvent.ROLE_UPDATE);
  await enforce(client, role.guild, 'antiRoleUpdate', info?.user, `Modified role ${role.name}`);
}

async function onWebhookUpdate(client, channel) {
  if (!channel.guild) return;
  const info = await getExecutor(channel.guild, AuditLogEvent.WEBHOOK_CREATE);
  if (info) await enforce(client, channel.guild, 'antiWebhook', info.user, `Created/modified a webhook`);
  else await enforce(client, channel.guild, 'antiWebhook', null, `Webhook changed`);
}

async function onGuildUpdate(client, oldGuild, newGuild) {
  if (oldGuild.ownerId !== newGuild.ownerId) {
    const info = await getExecutor(newGuild, AuditLogEvent.GUILD_UPDATE);
    if (info && info.user && !isSafe(newGuild, info.user)) {
      await punishUser(client, newGuild, info.user, 'Anti-Owner-Transfer | tried to take the server');
      addLog(newGuild.id, {
        action: 'antiOwnerTransfer',
        target: info.user.tag || info.user.id,
        reason: 'owner transfer attempt'
      });
      await sendLog(
        client,
        newGuild,
        '👑 Anti-Owner-Transfer',
        `**${info.user.tag || info.user.id}** tried to take ownership of the server → punished.`,
        0xff3b3b
      );
    }
    return;
  }
  const info = await getExecutor(newGuild, AuditLogEvent.GUILD_UPDATE);
  await enforce(client, newGuild, 'antiGuildUpdate', info?.user, `Changed server settings (name/icon/region...)`);
}

async function onEmojiCreate(client, emoji) {
  if (!emoji.guild) return;
  const info = await getExecutor(emoji.guild, AuditLogEvent.EMOJI_CREATE);
  await enforce(client, emoji.guild, 'antiEmoji', info?.user, `Added emoji ${emoji.name}`);
}

async function onEmojiDelete(client, emoji) {
  if (!emoji.guild) return;
  const info = await getExecutor(emoji.guild, AuditLogEvent.EMOJI_DELETE);
  await enforce(client, emoji.guild, 'antiEmoji', info?.user, `Deleted emoji ${emoji.name}`);
}

async function onMemberUpdate(client, oldMember, newMember) {
  const guild = newMember.guild;
  if (!featureOn(guild, 'antiRoleUpdate')) return;
  const added = newMember.roles.cache.filter((r) => !oldMember.roles.cache.has(r.id));
  const dangerous = added.find((r) => r.permissions.has(PermissionFlagsBits.Administrator));
  if (!dangerous) return;
  const info = await getExecutor(guild, AuditLogEvent.MEMBER_ROLE_UPDATE);
  if (!info || !info.user) return;
  const actor = info.user;
  if (actor.id === client.user.id) return;
  if (isSafe(guild, actor)) return;
  await newMember.roles.remove(dangerous.id, 'Hantakyro removed dangerous role').catch(() => {});
  await punishUser(client, guild, actor, `Anti-Role | granted Administrator role to ${newMember.user?.tag}`);
  await sendLog(
    client,
    guild,
    '🧨 Anti-Role',
    `**${actor.tag || actor.id}** granted an **Administrator** role to ${newMember.user?.tag || newMember.id}\nRole removed & actor punished.`,
    0xff3b3b
  );
}

async function onMessage(client, message) {
  if (message.author.bot) return;
  if (!message.guild) return;
  const guild = message.guild;
  const cfg = getGuild(guild.id);
  if (!cfg.protection.enabled) return;
  if (isSafe(guild, message.author)) return;

  if (
    featureOn(guild, 'antiEveryone') &&
    message.mentions.everyone &&
    (message.content.includes('@everyone') || message.content.includes('@here'))
  ) {
    const member = await guild.members.fetch(message.author.id).catch(() => null);
    if (member) {
      await member.timeout(60 * 60 * 1000, 'Hantakyro Anti-Everyone').catch(() => {});
    }
    await message.delete().catch(() => {});
    addLog(guild.id, { action: 'antiEveryone', target: message.author.tag, reason: '@everyone ping' });
    await sendLog(
      client,
      guild,
      '🔕 Anti-Everyone',
      `**${message.author.tag}** pings @everyone/@here → **1h timeout**`,
      0xff9900
    );
    return;
  }

  if (featureOn(guild, 'antiLink') && /https?:\/\/\S+/i.test(message.content)) {
    const member = await guild.members.fetch(message.author.id).catch(() => null);
    if (member) {
      await member.timeout(60 * 60 * 1000, 'Hantakyro Anti-Link').catch(() => {});
    }
    await message.delete().catch(() => {});
    addLog(guild.id, { action: 'antiLink', target: message.author.tag, reason: 'sent a link' });
    await sendLog(
      client,
      guild,
      '🔗 Anti-Link',
      `**${message.author.tag}** sent a link → **1h timeout** + message deleted`,
      0xff9900
    );
    return;
  }

  if (featureOn(guild, 'antiMention') && message.mentions.users.size > cfg.mentionThreshold) {
    const member = await guild.members.fetch(message.author.id).catch(() => null);
    if (member) {
      await member.timeout(10 * 60 * 1000, 'Hantakyro Anti-Mention').catch(() => {});
    }
    await message.delete().catch(() => {});
    addLog(guild.id, { action: 'antiMention', target: message.author.tag, reason: 'mass mentions' });
    await sendLog(
      client,
      guild,
      '📣 Anti-Mention',
      `**${message.author.tag}** mentioned too many users (${message.mentions.users.size}) → **10m timeout**`,
      0xff9900
    );
    return;
  }

  if (featureOn(guild, 'antiSpam')) {
    const now = Date.now();
    if (!joinTracker.has(guild.id)) joinTracker.set(guild.id, {});
    const map = joinTracker.get(guild.id);
    if (!map[message.author.id]) map[message.author.id] = [];
    map[message.author.id] = map[message.author.id].filter((t) => now - t < cfg.spamWindow);
    map[message.author.id].push(now);
    if (map[message.author.id].length >= cfg.spamThreshold) {
      const member = await guild.members.fetch(message.author.id).catch(() => null);
      if (member) {
        await member.timeout(10 * 60 * 1000, 'Hantakyro Anti-Spam').catch(() => {});
        await message.channel.bulkDelete(cfg.spamThreshold).catch(() => {});
      }
      addLog(guild.id, { action: 'antiSpam', target: message.author.tag, reason: 'mass messages' });
      await sendLog(
        client,
        guild,
        '📢 Anti-Spam',
        `**${message.author.tag}** is spamming → **10m timeout** + messages cleaned`,
        0xff9900
      );
    }
  }
}

function initProtection(client) {
  client.on(Events.GuildBanAdd, (ban) => onBanAdd(client, ban.guild, ban.user));
  client.on(Events.GuildMemberRemove, (member) => onMemberRemove(client, member.guild, member));
  client.on(Events.GuildMemberAdd, (member) => onMemberAdd(client, member.guild, member));
  client.on(Events.ChannelCreate, (channel) => onChannelCreate(client, channel));
  client.on(Events.ChannelDelete, (channel) => onChannelDelete(client, channel));
  client.on(Events.ChannelUpdate, (oldC, newC) => onChannelUpdate(client, newC));
  client.on(Events.RoleCreate, (role) => onRoleCreate(client, role));
  client.on(Events.RoleDelete, (role) => onRoleDelete(client, role));
  client.on(Events.RoleUpdate, (oldR, newR) => onRoleUpdate(client, newR));
  client.on(Events.WebhooksUpdate, (channel) => onWebhookUpdate(client, channel));
  client.on(Events.GuildUpdate, (oldG, newG) => onGuildUpdate(client, oldG, newG));
  client.on(Events.EmojiCreate, (emoji) => onEmojiCreate(client, emoji));
  client.on(Events.EmojiDelete, (emoji) => onEmojiDelete(client, emoji));
  client.on(Events.GuildMemberUpdate, (oldM, newM) => onMemberUpdate(client, oldM, newM));
  client.on(Events.MessageCreate, (message) => onMessage(client, message));
  console.log('Protection engine loaded. 🛡️');
}

module.exports = { initProtection, isSafe };

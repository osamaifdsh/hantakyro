const botActions = new Set();
const joinTracker = new Map();
const raidTracker = new Map();

function markBotAction(key) {
  botActions.add(key);
  setTimeout(() => botActions.delete(key), 20000);
}

function isBotAction(key) {
  return botActions.has(key);
}

module.exports = { botActions, markBotAction, isBotAction, joinTracker, raidTracker };

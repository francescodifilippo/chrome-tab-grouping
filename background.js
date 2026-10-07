const GROUP_COLORS = ["blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange"];

async function getNextColor(windowId) {
  const existingGroups = await chrome.tabGroups.query({ windowId });
  const usedColors = new Set(existingGroups.map(g => g.color));
  const available = GROUP_COLORS.filter(c => !usedColors.has(c));
  if (available.length > 0) return available[0];
  return GROUP_COLORS[Math.floor(Math.random() * GROUP_COLORS.length)];
}

function formatTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

async function buildDefaultTitle() {
  const { namePrefix } = await chrome.storage.local.get({ namePrefix: "AutoGroup" });
  return `${namePrefix} ${formatTimestamp()}`;
}

function groupTabIds(tabIds) {
  return new Promise((resolve, reject) => {
    chrome.tabs.group({ tabIds }, (groupId) => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve(groupId);
    });
  });
}

function updateGroup(groupId, props) {
  return new Promise((resolve, reject) => {
    chrome.tabGroups.update(groupId, props, () => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve();
    });
  });
}

async function groupUngroupedTabs(customTitle) {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const ungrouped = tabs.filter(t => t.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE);

  if (ungrouped.length === 0) return { success: false, message: "No tab to group." };

  const tabIds = ungrouped.map(t => t.id);
  const windowId = ungrouped[0].windowId;

  const color = await getNextColor(windowId);
  const title = customTitle || await buildDefaultTitle();
  const { collapseGroup } = await chrome.storage.local.get({ collapseGroup: true });

  const groupId = await groupTabIds(tabIds);

  const updateProps = { color, title };
  if (collapseGroup) updateProps.collapsed = true;
  await updateGroup(groupId, updateProps);

  // TODO: closeGroup — non implementabile: Chrome Extensions API non espone un metodo per
  // chiudere un gruppo salvato dalla tab strip (equivalente di Alt+Shift+W).
  // Nessuna proprietà "saved" in tabGroups.update(), nessun tabGroups.close().
  // chrome.tabs.remove() elimina i tab anche dal gruppo salvato → non utilizzabile.
  // Monitorare: https://issues.chromium.org/issues/323982812

  return { success: true, count: ungrouped.length, groupId };
}

// Keyboard shortcut handler
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "group-ungrouped-tabs") {
    try {
      await groupUngroupedTabs();
    } catch (e) {
      console.error('[GroupThemAll] shortcut error:', e);
    }
  }
});

// Message handler (popup)
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "groupTabs") {
    groupUngroupedTabs(message.title)
      .then(sendResponse)
      .catch(err => sendResponse({ success: false, message: err.message }));
    return true;
  }
});

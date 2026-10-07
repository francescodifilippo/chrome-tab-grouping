const btn = document.getElementById("groupBtn");
const status = document.getElementById("status");
const nameInput = document.getElementById("groupName");
const shortcutDisplay = document.getElementById("shortcutDisplay");

async function getPrefix() {
  const data = await chrome.storage.local.get({ namePrefix: "AutoGroup" });
  return data.namePrefix;
}

function buildTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

async function buildDefaultName() {
  const prefix = await getPrefix();
  return `${prefix} ${buildTimestamp()}`;
}

async function updateCount() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const ungrouped = tabs.filter(t => t.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE);
  status.textContent = `${ungrouped.length} ungrouped tabs`;
  btn.disabled = ungrouped.length === 0;
  nameInput.disabled = ungrouped.length === 0;
}

async function loadShortcutLabel() {
  const commands = await chrome.commands.getAll();
  const cmd = commands.find(c => c.name === "group-ungrouped-tabs");
  if (cmd?.shortcut) {
    shortcutDisplay.textContent = `Shortcut: ${cmd.shortcut}`;
  } else {
    shortcutDisplay.textContent = "Shortcut: not assigned";
  }
}

// Set default name on open
buildDefaultName().then(name => { nameInput.value = name; });

btn.addEventListener("click", async () => {
  btn.disabled = true;
  const title = nameInput.value.trim() || await buildDefaultName();
  chrome.runtime.sendMessage({ action: "groupTabs", title }, async (result) => {
    if (result && result.success) {
      status.textContent = `${result.count} tab grouped!`;
      setTimeout(() => window.close(), 800);
    } else {
      status.textContent = result?.message || "No tabs to group.";
      btn.disabled = false;
    }
  });
});

function checkChromeVersion() {
  const match = navigator.userAgent.match(/Chrome\/(\d+)/);
  if (match && parseInt(match[1], 10) < 146) {
    document.getElementById("chromeWarning").style.display = "block";
  }
}

updateCount();
loadShortcutLabel();
checkChromeVersion();

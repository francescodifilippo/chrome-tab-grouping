const STORAGE_DEFAULTS = { namePrefix: "AutoGroup", closeGroup: true, collapseGroup: true };

const currentShortcut = document.getElementById("currentShortcut");
const changeShortcutBtn = document.getElementById("changeShortcutBtn");
const namePrefixInput = document.getElementById("namePrefix");
const closeGroupChk = document.getElementById("closeGroup");
const collapseGroupChk = document.getElementById("collapseGroup");
const saveBtn = document.getElementById("saveBtn");
const savedMsg = document.getElementById("savedMsg");

async function loadShortcut() {
  const commands = await chrome.commands.getAll();
  const cmd = commands.find(c => c.name === "group-ungrouped-tabs");
  currentShortcut.textContent = cmd?.shortcut || "Not configured";
}

async function loadSettings() {
  const data = await chrome.storage.local.get(STORAGE_DEFAULTS);
  namePrefixInput.value = data.namePrefix;
  closeGroupChk.checked = data.closeGroup;
  collapseGroupChk.checked = data.collapseGroup;
}

saveBtn.addEventListener("click", async () => {
  await chrome.storage.local.set({
    namePrefix: namePrefixInput.value.trim() || STORAGE_DEFAULTS.namePrefix,
    closeGroup: closeGroupChk.checked,
    collapseGroup: collapseGroupChk.checked
  });
  savedMsg.classList.add("visible");
  setTimeout(() => savedMsg.classList.remove("visible"), 2000);
});

changeShortcutBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
});

loadShortcut();
loadSettings();

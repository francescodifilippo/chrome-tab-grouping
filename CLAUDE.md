# CLAUDE.md - GroupThemAll Chrome Extension

**Last updated:** 2026-02-19

## Panoramica Progetto

**GroupThemAll** è una Chrome Extension (Manifest V3) che raggruppa tutti i tab non raggruppati della finestra corrente in un nuovo gruppo con un click o shortcut da tastiera.

### Tecnologie
- **Chrome Extension Manifest V3**
- **JavaScript** vanilla (no framework, no build step)
- **Chrome APIs**: `tabs`, `tabGroups`, `storage`, `commands`

## Struttura Progetto

```
chrome-tab-grouping/
├── manifest.json      ← Manifest V3, permessi e configurazione
├── background.js      ← Service worker: logica raggruppamento + handler shortcut
├── popup.html         ← UI popup con campo nome e pulsante
├── popup.js           ← Logica popup: conta tab, invia messaggio al background
├── options.html       ← Pagina impostazioni (tasto destro → Settings)
├── options.js         ← Logica impostazioni: prefisso nome, close/collapse, shortcut
├── icons/             ← Icone 16/48/128px
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── CLAUDE.md          ← Questo file
```

## Architettura

```
┌─────────────┐    message     ┌──────────────┐
│  popup.js   │ ──────────────→│ background.js │
│  (UI)       │  {action,title}│ (service wkr) │
└─────────────┘    ←response   └──────────────┘
                                      │
                               chrome.tabs.group()
                               chrome.tabGroups.update()
```

- **popup.js** → mostra conteggio tab liberi, campo nome editabile, pulsante
- **background.js** → riceve messaggi dal popup, esegue raggruppamento
- **options.js** → configura prefisso nome, close/collapse post-raggruppamento, shortcut
- **storage** → persiste le impostazioni utente (prefisso nome, close/collapse post-raggruppamento)

### Flusso Raggruppamento

1. Popup genera nome auto: `{prefisso} {YYYYMMDDHHmmss}`
2. Utente può modificare il nome nel campo di testo
3. Click su pulsante → `sendMessage({action: "groupTabs", title})`
4. Background: query tab non raggruppati → `chrome.tabs.group({ tabIds })` → `tabGroups.update({ color, title, collapsed? })`
5. Colore assegnato automaticamente (primo non usato nella finestra)
6. `closeGroup`: **non implementato** — vedi TODO in fondo

### Shortcut da Tastiera

- Default: `Alt+G` (configurabile in `chrome://extensions/shortcuts`)
- Lo shortcut usa il nome auto-generato (non passa dal popup)

## Permessi Chrome

| Permesso | Motivo |
|----------|--------|
| `tabs` | Query tab, raggruppamento |
| `tabGroups` | Creare/aggiornare gruppi, leggere colori esistenti |
| `storage` | Impostazioni utente: namePrefix, closeGroup, collapseGroup |

## Installazione Sviluppo

1. `chrome://extensions/` → attiva "Modalità sviluppatore"
2. "Carica estensione non pacchettizzata" → seleziona questa cartella
3. L'estensione appare nella toolbar

## Preparazione per Chrome Web Store

Per pubblicare servono:
1. **Icone reali** (non placeholder) - 16, 48, 128px PNG
2. **Screenshot** dell'estensione in uso (1280x800 o 640x400)
3. **Account sviluppatore Google** ($5 una tantum)
4. **ZIP del progetto**: `zip -r groupthemall.zip manifest.json background.js popup.html popup.js options.html options.js icons/`

## Convenzioni di Codice

- **Naming**: camelCase per funzioni/variabili, UPPER_SNAKE_CASE per costanti
- **Chrome APIs**: callback wrappati in Promise (non async/await nativo); ogni callback controlla `chrome.runtime.lastError`
- **chrome.tabGroups.update** — accetta `{ color, title, collapsed }` (NO `saved`)
- **chrome.tabs.group({ tabIds })** — raggruppa tutti i tab in un unico call (non iterare uno per uno)
- **UI language**: tutta la UI (popup, options, messaggi) in inglese
- **Stile UI**: dark theme (#1a1a2e background), accent blue (#4361ee)

## Note per Claude Code

1. **No build step** - I file JS vanno direttamente a Chrome, non c'è transpilazione
2. **Manifest V3** - Service worker (non background page), no `chrome.browserAction`
3. **Testare modifiche** - Dopo ogni modifica, ricaricare l'estensione in `chrome://extensions/`
4. **Storage API** - Usare `chrome.storage.local` con default nel `.get()`; chiavi attuali:
   - `namePrefix: "AutoGroup"` — prefisso nome auto
   - `closeGroup: true` — salva e chiude il gruppo dopo la creazione (rimane in Saved tab groups)
   - `collapseGroup: true` — collassa il gruppo nella tab strip dopo la creazione
5. **Message passing** - Il popup comunica col background via `chrome.runtime.sendMessage`

## TODO Futuri

- [ ] **closeGroup** — Implementare la chiusura del gruppo salvato dalla tab strip (equivalente Alt+Shift+W).
  L'API `chrome.tabGroups` non espone `close()`, `remove()` né la proprietà `saved`.
  `chrome.tabs.remove()` elimina i tab anche dal gruppo salvato → non utilizzabile.
  Opzione disabilitata nella UI (options.html).
  Monitorare: https://issues.chromium.org/issues/323982812

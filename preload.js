const { contextBridge, ipcRenderer } = require('electron');

// ── Discord sidebar bridge ───────────────────────────────────────────────

contextBridge.exposeInMainWorld('discordSidebar', {
  open: (url) => ipcRenderer.send('discord-sidebar:open', url),
  close: () => ipcRenderer.send('discord-sidebar:close'),
  setBounds: (bounds) => ipcRenderer.send('discord-sidebar:set-bounds', bounds),
  onCloseRequest: (callback) => {
    ipcRenderer.on('discord-sidebar:close-request', callback);
  },
  offCloseRequest: (callback) => {
    ipcRenderer.off('discord-sidebar:close-request', callback);
  },
  onRefreshBounds: (callback) => {
    ipcRenderer.on('discord-sidebar:refresh-bounds', callback);
  },
  offRefreshBounds: (callback) => {
    ipcRenderer.off('discord-sidebar:refresh-bounds', callback);
  },
});

// ── Window controls bridge ───────────────────────────────────────────────

contextBridge.exposeInMainWorld('windowControls', {
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  zoomIn: () => ipcRenderer.send('window:zoom-in'),
  zoomOut: () => ipcRenderer.send('window:zoom-out'),
  zoomReset: () => ipcRenderer.send('window:zoom-reset'),
  getZoomFactor: () => ipcRenderer.sendSync('window:get-zoom-factor'),
  enterLoginMode: () => ipcRenderer.send('window:enter-login-mode'),
  exitLoginMode: () => ipcRenderer.send('window:exit-login-mode'),
});

// ── Desktop auth bridge ──────────────────────────────────────────────────

const deepLinkHandlers = new WeakMap();

contextBridge.exposeInMainWorld('desktopAuth', {
  saveToken: (token) => ipcRenderer.invoke('auth:save-token', token),
  readToken: () => ipcRenderer.invoke('auth:read-token'),
  deleteToken: () => ipcRenderer.invoke('auth:delete-token'),
  openLoginPage: () => ipcRenderer.invoke('auth:open-login'),
  onDeepLinkToken: (callback) => {
    const handler = (_event, token) => callback(token);
    deepLinkHandlers.set(callback, handler);
    ipcRenderer.on('auth:deep-link-token', handler);
  },
  offDeepLinkToken: (callback) => {
    const handler = deepLinkHandlers.get(callback);
    if (handler) {
      ipcRenderer.off('auth:deep-link-token', handler);
      deepLinkHandlers.delete(callback);
    }
  },
});

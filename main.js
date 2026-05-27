const {
  app,
  BrowserWindow,
  WebContentsView,
  ipcMain,
  session,
  Menu,
  shell,
} = require('electron');
const path = require('path');
const net = require('net');
const { fork } = require('child_process');
const http = require('http');
const keytar = require('keytar');
const { autoUpdater } = require('electron-updater');

let mainWindow;
let discordView;
let nextServerProcess;
let currentBounds = { x: 0, y: 0, width: 0, height: 0 };
let currentCssBounds = { x: 0, y: 0, width: 0, height: 0 };
let currentDiscordUrl = '';
let discordDebuggerAttached = false;
let isDiscordViewAdded = false;
let pendingDeepLinkToken = null;

Menu.setApplicationMenu(null);

// ── Auto-updater ────────────────────────────────────────────────────────────
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'hasin-codes',
  repo: 'Z-Fushou',
});

autoUpdater.on('update-available', (info) => {
  safeConsole('log', '[updater] Update available:', info.version);
});

autoUpdater.on('download-progress', (progress) => {
  safeConsole('log', `[updater] Downloading ${progress.percent.toFixed(1)}% (${(progress.transferred / 1048576).toFixed(1)}/${(progress.total / 1048576).toFixed(1)} MB)`);
});

autoUpdater.on('update-downloaded', (info) => {
  safeConsole('log', '[updater] Update downloaded:', info.version);
  // Notify the renderer so it can show a restart prompt
  mainWindow?.webContents.send('updater:available', info.version);
});

autoUpdater.on('error', (error) => {
  safeConsole('error', '[updater] Error:', error?.message || error);
});

// ── Deep-link / keytar constants ──────────────────────────────────────────
const DEEP_LINK_SCHEME = 'z-fushou';
const KEYTAR_SERVICE = 'z-fushou';
const KEYTAR_ACCOUNT = 'desktop-token';
const APP_URL =
  process.env.APP_URL || 'https://zfushou.hasinraiyan.me';

// ── Single-instance lock ──────────────────────────────────────────────────
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine) => {
    const url = commandLine.find((arg) =>
      arg.startsWith(`${DEEP_LINK_SCHEME}://`),
    );
    if (url) handleDeepLink(url);

    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(boot).catch((error) => {
    safeConsole('error', 'Failed to boot:', error);
    app.quit();
  });
}

// ── macOS open-url ────────────────────────────────────────────────────────
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

const isDev = !app.isPackaged && process.env.ELECTRON_RENDERER_URL;
const devUrl = process.env.ELECTRON_RENDERER_URL || 'http://localhost:3000';
const discordMobileUserAgent =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

function safeConsole(method, ...args) {
  try {
    console[method](...args);
  } catch (error) {
    if (error?.code !== 'EPIPE') throw error;
  }
}

function toInt(value) {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

function sanitizeBounds(bounds) {
  return {
    x: toInt(bounds?.x),
    y: toInt(bounds?.y),
    width: toInt(bounds?.width),
    height: toInt(bounds?.height),
  };
}

function isDiscordUrl(value) {
  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === 'https:' &&
      (parsed.hostname === 'discord.com' ||
        parsed.hostname.endsWith('.discord.com'))
    );
  } catch {
    return false;
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function findAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });
}

function waitForServer(url, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;

  return new Promise((resolve, reject) => {
    const check = () => {
      let settled = false;
      const request = http.get(url, (response) => {
        response.resume();
        response.once('end', () => {
          settled = true;
          resolve();
        });
      });

      request.on('error', (error) => {
        if (settled) return;

        if (Date.now() >= deadline) {
          settled = true;
          reject(error);
          return;
        }
        setTimeout(check, 150);
      });

      request.setTimeout(2000, () => {
        request.destroy(new Error(`Timed out waiting for ${url}`));
      });
    };

    check();
  });
}

async function loadUrlWithRetry(webContentsOwner, url, attempts = 3) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await webContentsOwner.loadURL(url);
      return;
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      await delay(250 * attempt);
    }
  }

  throw lastError;
}

async function startProductionNextServer() {
  const port = await findAvailablePort();
  const appPath = app.getAppPath();
  const standaloneDir = path.join(appPath, '.next', 'standalone');
  const serverPath = path.join(standaloneDir, 'server.js');
  const rendererUrl = `http://127.0.0.1:${port}`;

  nextServerProcess = fork(serverPath, [], {
    cwd: standaloneDir,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(port),
      HOSTNAME: '127.0.0.1',
    },
    silent: true,
  });

  nextServerProcess.stdout?.on('data', (chunk) => {
    safeConsole('log', `[next] ${chunk.toString().trim()}`);
  });
  nextServerProcess.stderr?.on('data', (chunk) => {
    safeConsole('error', `[next] ${chunk.toString().trim()}`);
  });
  nextServerProcess.once('exit', (code) => {
    if (code !== 0 && mainWindow) {
      safeConsole(
        'error',
        `Standalone Next server exited with code ${code}`,
      );
    }
  });

  await Promise.race([
    waitForServer(rendererUrl),
    new Promise((_, reject) => {
      nextServerProcess.once('exit', (code, signal) => {
        reject(
          new Error(
            `Standalone Next server exited before startup (code ${code}, signal ${signal})`,
          ),
        );
      });
      nextServerProcess.once('error', reject);
    }),
  ]);
  return rendererUrl;
}

// ── Deep-link handling ────────────────────────────────────────────────────

function handleDeepLink(urlString) {
  try {
    safeConsole('log', 'DEEPLINK url:', urlString);
    const url = new URL(urlString);
    const token = url.searchParams.get('token');
    safeConsole('log', 'DEEPLINK token:', token ? `${token.slice(0, 8)}... (${token.length} chars)` : 'MISSING');
    if (!token) return;

    if (mainWindow && !mainWindow.webContents.isLoading()) {
      safeConsole('log', 'DEEPLINK sending token to renderer via IPC');
      mainWindow.webContents.send('auth:deep-link-token', token);
      safeConsole('log', 'DEEPLINK IPC send complete');
    } else {
      safeConsole('log', 'DEEPLINK buffered (renderer not ready)');
      pendingDeepLinkToken = token;
    }
  } catch (e) {
    safeConsole('error', 'Failed to parse deep link:', e);
  }
}

// ── Discord sidebar ───────────────────────────────────────────────────────

const DISCORD_FIXED_WIDTH = 430;

function applyDiscordBounds(cssBounds) {
  if (cssBounds) currentCssBounds = sanitizeBounds(cssBounds);

  if (!discordView || !isDiscordViewAdded) return;

  try {
    discordView.webContents.setZoomFactor(1.0);
  } catch {
    // View may not be ready yet
  }

  if (currentCssBounds.width < 2 || currentCssBounds.height < 2) {
    currentBounds = { x: 0, y: 0, width: 0, height: 0 };
    discordView.setBounds(currentBounds);
    return;
  }

  const zoomFactor = mainWindow.webContents.getZoomFactor();
  const contentSize = mainWindow.getContentSize();

  currentBounds = sanitizeBounds({
    x: contentSize[0] - DISCORD_FIXED_WIDTH,
    y: Math.round(currentCssBounds.y * zoomFactor),
    width: DISCORD_FIXED_WIDTH,
    height: Math.round(contentSize[1] - currentCssBounds.y * zoomFactor),
  });

  discordView.setBounds(currentBounds);
  applyDiscordMobileMetrics();
}

function applyDiscordMobileMetrics() {
  if (!discordView || currentBounds.width === 0 || currentBounds.height === 0)
    return;

  try {
    if (!discordDebuggerAttached) {
      discordView.webContents.debugger.attach('1.3');
      discordDebuggerAttached = true;
    }

    discordView.webContents.debugger.sendCommand(
      'Emulation.setUserAgentOverride',
      {
        userAgent: discordMobileUserAgent,
        platform: 'iPhone',
      },
    );
    discordView.webContents.debugger.sendCommand(
      'Emulation.setDeviceMetricsOverride',
      {
        width: DISCORD_FIXED_WIDTH,
        height: Math.max(480, currentBounds.height),
        deviceScaleFactor: 3,
        mobile: true,
        screenOrientation: {
          type: 'portraitPrimary',
          angle: 0,
        },
      },
    );
  } catch (error) {
    safeConsole(
      'warn',
      'Discord mobile emulation could not be applied:',
      error,
    );
  }
}

function createDiscordView() {
  const discordSession = session.fromPartition('persist:discord-session');

  discordView = new WebContentsView({
    webPreferences: {
      partition: 'persist:discord-session',
      sandbox: true,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  discordView.webContents.setUserAgent(discordMobileUserAgent);

  discordView.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'Escape' && input.type === 'keyDown') {
      mainWindow?.webContents.send('discord-sidebar:close-request');
    }
  });

  // Open external links in the system browser instead of hijacking the Discord view
  discordView.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  discordView.webContents.on('will-navigate', (event, url) => {
    if (!isDiscordUrl(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  discordSession.setPermissionRequestHandler(
    (_webContents, permission, callback) => {
      callback(['clipboard-sanitized-write', 'notifications'].includes(permission));
    },
  );
}

// ── Main window ───────────────────────────────────────────────────────────

async function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 650,
    resizable: false,
    maximizable: false,
    backgroundColor: '#0f0f0f',
    frame: false,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  createDiscordView();

  const rendererUrl = isDev ? devUrl : await startProductionNextServer();
  await loadUrlWithRetry(mainWindow, rendererUrl);

  // Open DevTools in dev mode for debugging
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Pipe ALL renderer console output to the terminal for debugging
  mainWindow.webContents.on('console-message', (_event, level, message) => {
    const prefix = level === 3 ? '[renderer ERROR]' : '[renderer]';
    safeConsole(level === 3 ? 'error' : 'log', prefix, message);
  });

  // Open external links in the system browser instead of replacing the dashboard
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const allowed = url.startsWith('http://localhost:') || url.startsWith('http://127.0.0.1:');
    if (!allowed) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Send buffered deep-link token once the renderer is ready
  mainWindow.webContents.on('did-finish-load', () => {
    safeConsole('log', 'RENDERER did-finish-load');
    if (pendingDeepLinkToken) {
      safeConsole('log', 'RENDERER sending buffered deep-link token');
      mainWindow.webContents.send(
        'auth:deep-link-token',
        pendingDeepLinkToken,
      );
      pendingDeepLinkToken = null;
    }
  });

  for (const eventName of [
    'resize',
    'move',
    'maximize',
    'unmaximize',
    'restore',
  ]) {
    mainWindow.on(eventName, () => applyDiscordBounds());
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    discordView = null;
    isDiscordViewAdded = false;
  });
}

// ── Boot ──────────────────────────────────────────────────────────────────

async function boot() {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(DEEP_LINK_SCHEME, process.execPath, [path.resolve(process.argv[1])]);
    }
  } else {
    app.setAsDefaultProtocolClient(DEEP_LINK_SCHEME);
  }

  // On Windows, a deep link that launches the app for the first time arrives
  // via process.argv (no second-instance event because there is no first
  // instance yet).
  if (process.platform === 'win32' || process.platform === 'linux') {
    const url = process.argv.find((arg) =>
      arg.startsWith(`${DEEP_LINK_SCHEME}://`),
    );
    if (url) handleDeepLink(url);
  }

  await createMainWindow();

  // Check for updates after the window is ready
  if (!isDev) {
    try {
      await autoUpdater.checkForUpdates();
    } catch (e) {
      safeConsole('error', '[updater] Check failed:', e?.message || e);
    }
  }
}

// ── Discord sidebar IPC ──────────────────────────────────────────────────

ipcMain.on('discord-sidebar:set-bounds', (_event, bounds) => {
  applyDiscordBounds(bounds);
});

ipcMain.on('discord-sidebar:open', (_event, url) => {
  if (
    !discordView ||
    !isDiscordUrl(url)
  ) {
    safeConsole(
      'warn',
      'Invalid discord open request. discordView exists:',
      !!discordView,
      'isDiscordUrl:',
      isDiscordUrl(url),
    );
    return;
  }

  if (!isDiscordViewAdded) {
    mainWindow.contentView.addChildView(discordView);
    isDiscordViewAdded = true;
  }

  currentDiscordUrl = url;
  discordView.webContents.loadURL(url, {
    userAgent: discordMobileUserAgent,
    extraHeaders: 'Sec-CH-UA-Mobile: ?1',
  });
  applyDiscordBounds();
});

ipcMain.on('discord-sidebar:close', () => {
  if (isDiscordViewAdded) {
    mainWindow.contentView.removeChildView(discordView);
    isDiscordViewAdded = false;
  }
  applyDiscordBounds({ x: 0, y: 0, width: 0, height: 0 });
});

// ── Window control IPC ───────────────────────────────────────────────────

ipcMain.on('window:enter-login-mode', () => {
  if (!mainWindow) return;
  mainWindow.unmaximize();
  mainWindow.setMinimumSize(0, 0);
  mainWindow.setResizable(false);
  mainWindow.setMaximizable(false);
  mainWindow.setSize(1000, 650);
  mainWindow.center();
});

ipcMain.on('window:exit-login-mode', () => {
  if (!mainWindow) return;
  mainWindow.setMinimumSize(1100, 720);
  mainWindow.setResizable(true);
  mainWindow.setMaximizable(true);
  mainWindow.setSize(1440, 920);
  mainWindow.center();
});

ipcMain.on('window:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow?.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('window:close', () => {
  mainWindow?.close();
});

function sendStaggeredRefreshBounds() {
  if (!mainWindow) return;
  const delays = [50, 150, 350, 600];
  for (const d of delays) {
    setTimeout(() => {
      if (mainWindow)
        mainWindow.webContents.send('discord-sidebar:refresh-bounds');
    }, d);
  }
}

ipcMain.on('window:zoom-in', () => {
  if (mainWindow) {
    const level = mainWindow.webContents.getZoomLevel();
    mainWindow.webContents.setZoomLevel(level + 0.5);
    applyDiscordBounds();
    sendStaggeredRefreshBounds();
  }
});

ipcMain.on('window:zoom-out', () => {
  if (mainWindow) {
    const level = mainWindow.webContents.getZoomLevel();
    mainWindow.webContents.setZoomLevel(level - 0.5);
    applyDiscordBounds();
    sendStaggeredRefreshBounds();
  }
});

ipcMain.on('window:zoom-reset', () => {
  if (mainWindow) {
    mainWindow.webContents.setZoomLevel(0);
    applyDiscordBounds();
    sendStaggeredRefreshBounds();
  }
});

ipcMain.on('window:get-zoom-factor', (event) => {
  event.returnValue = mainWindow ? mainWindow.webContents.getZoomFactor() : 1;
});

// ── Auth IPC ─────────────────────────────────────────────────────────────

ipcMain.handle('auth:save-token', async (_event, token) => {
  await keytar.setPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT, token);
});

ipcMain.handle('auth:read-token', async () => {
  return keytar.getPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT);
});

ipcMain.handle('auth:delete-token', async () => {
  await keytar.deletePassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT);
});

ipcMain.handle('auth:open-login', async () => {
  await shell.openExternal(`${APP_URL}/desktop-login`);
});

// ── Updater IPC ────────────────────────────────────────────────────────────

ipcMain.on('updater:restart', () => {
  autoUpdater.quitAndInstall();
});

// ── Lifecycle ────────────────────────────────────────────────────────────

app.on('window-all-closed', () => {
  nextServerProcess?.kill();
  nextServerProcess = null;
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow().catch((error) => {
      safeConsole('error', 'Failed to create main window:', error);
    });
  }
});

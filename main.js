const { app, BrowserWindow, ipcMain, session, shell } = require('electron');
const path = require('path');

const TARGET_URL = 'https://uncensored.chat/';
const TARGET_ORIGIN = new URL(TARGET_URL).origin;

let mainWindow;

function isAllowedHttpUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 800,
    minHeight: 600,
    title: 'GPT Pro',
    icon: path.join(__dirname, 'assets', 'logo.png'),
    frame: false,
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true
    }
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  mainWindow.webContents.on('will-attach-webview', (event, webPreferences, params) => {
    delete webPreferences.preload;
    webPreferences.nodeIntegration = false;
    webPreferences.contextIsolation = true;

    if (!params.src || !params.src.startsWith(TARGET_ORIGIN)) {
      event.preventDefault();
    }
  });

  mainWindow.loadFile('index.html');
}

app.on('web-contents-created', (event, contents) => {
  if (contents.getType() === 'webview') {
    contents.setWindowOpenHandler(({ url }) => {
      if (isAllowedHttpUrl(url)) {
        shell.openExternal(url);
      }
      return { action: 'deny' };
    });

    contents.on('will-navigate', (navEvent, url) => {
      try {
        const parsed = new URL(url);
        if (parsed.origin !== TARGET_ORIGIN) {
          navEvent.preventDefault();
          if (isAllowedHttpUrl(url)) {
            shell.openExternal(url);
          }
        }
      } catch {
        navEvent.preventDefault();
      }
    });
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Window Control IPC Handlers
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

// IPC Handler to clear site storage for TARGET_ORIGIN
ipcMain.handle('clear-site-data', async () => {
  try {
    const defaultSession = session.defaultSession;

    // Clear all storage types matching Chrome DevTools "Clear site data"
    await defaultSession.clearStorageData({
      origin: TARGET_ORIGIN,
      storages: [
        'appcache',
        'cookies',
        'filesystem',
        'indexdb',
        'localstorage',
        'shadercache',
        'websql',
        'serviceworkers',
        'cachestorage'
      ]
    });

    await defaultSession.clearCache();

    return { success: true, origin: TARGET_ORIGIN };
  } catch (err) {
    console.error('Failed to clear storage:', err);
    return { success: false, error: err.message };
  }
});

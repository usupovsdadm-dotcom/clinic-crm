const { app, BrowserWindow, shell, Notification, ipcMain, session } = require('electron');
const path = require('path');
const APP_URL = process.env.CRM_URL || 'https://d5dngibqhdats4u9s7j1.jki8ffxa.apigw.yandexcloud.net/app/';
const APP_ORIGIN = new URL(APP_URL).origin;
app.setName('CRM для клиник');
if (process.platform === 'win32') app.setAppUserModelId('ru.clinic-crm.desktop');
// Cyrillic app name breaks the User-Agent header (gateway rejects it) -> force ASCII UA
app.userAgentFallback = app.userAgentFallback.replace(/[^\x20-\x7E]+/g, '').replace(/\s{2,}/g, ' ') + ' ClinicCRMDesktop/' + app.getVersion();
let win;
if (!app.requestSingleInstanceLock()) { app.quit(); }
else {
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.show(); win.focus(); } });
  app.whenReady().then(() => {
    session.defaultSession.setPermissionRequestHandler((wc, perm, cb) =>
      cb(['notifications', 'media', 'clipboard-read', 'clipboard-sanitized-write', 'fullscreen'].includes(perm)));
    win = new BrowserWindow({
      width: 1400, height: 900, minWidth: 1000, minHeight: 650, title: 'CRM для клиник',
      icon: path.join(__dirname, 'build', 'icon.png'), backgroundColor: '#ffffff', autoHideMenuBar: true, show: false,
      webPreferences: { preload: path.join(__dirname, 'preload.js'), partition: 'persist:crm', contextIsolation: true, sandbox: true }
    });
    win.setMenuBarVisibility(false);
    win.once('ready-to-show', () => win.show());
    win.on('page-title-updated', (e) => { e.preventDefault(); win.setTitle('CRM для клиник'); });
    const isInternal = (u) => { try { return new URL(u).origin === APP_ORIGIN || u.startsWith('file:'); } catch { return false; } };
    win.webContents.setWindowOpenHandler(({ url }) => { if (!isInternal(url)) shell.openExternal(url); else win.loadURL(url); return { action: 'deny' }; });
    win.webContents.on('will-navigate', (e, url) => { if (!isInternal(url)) { e.preventDefault(); shell.openExternal(url); } });
    win.webContents.on('did-fail-load', (e, code, desc, url, isMain) => {
      if (isMain && code !== -3) win.loadFile(path.join(__dirname, 'offline.html'), { query: { u: APP_URL } });
    });
    win.loadURL(APP_URL);
  });
  ipcMain.on('notify', (_e, { title, body }) => {
    if (!Notification.isSupported()) return;
    const n = new Notification({ title: title || 'CRM для клиник', body: body || '', icon: path.join(__dirname, 'build', 'icon.png') });
    n.on('click', () => { if (win) { win.show(); win.focus(); } });
    n.show();
  });
  ipcMain.on('retry', () => win && win.loadURL(APP_URL));
  app.on('window-all-closed', () => app.quit());
}

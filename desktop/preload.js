const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('crmDesktop', {
  isDesktop: true,
  notify: (title, body) => ipcRenderer.send('notify', { title, body }),
  retry: () => ipcRenderer.send('retry')
});

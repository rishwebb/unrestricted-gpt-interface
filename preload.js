const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('gptPro', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  clearSiteData: () => ipcRenderer.invoke('clear-site-data')
});

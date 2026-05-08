const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    pedirProductos: () => ipcRenderer.invoke('canal-supabase') 
});


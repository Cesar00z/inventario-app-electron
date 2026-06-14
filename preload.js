const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    pedirProductos: () => ipcRenderer.invoke('canal-supabase'),
    pedirCategorias: () => ipcRenderer.invoke('get-categorias'),
    pedirUnidades: () => ipcRenderer.invoke('get-unidades-medida'),
    agregarProducto: (producto) => ipcRenderer.invoke('add-product', producto),
    obtenerDashboardStats: () => ipcRenderer.invoke('get-dashboard-stats'),
    registrarSalida: (datos) => ipcRenderer.invoke('registrar-salida', datos),
    obtenerMovimientos: () => ipcRenderer.invoke("obtener-movimientos"),
});


//main process
import { app, BrowserWindow, Menu, screen, ipcMain } from "electron";
import getProductos from "./utils/mostrarDatos.js";
import getCategorias from "./utils/getCategorias.js";
import getUnidades from "./utils/getUnidades.js";
import supabaseClient from "./lib/supabase.js";
import getDashboardStats from "./utils/getStock.js";

import path from "path";
import { fileURLToPath } from "url";
import { flushCompileCache } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//obtener productos
ipcMain.handle("canal-supabase", async () => {
  return await getProductos();
});

//obtener categorias
ipcMain.handle("get-categorias", async () => {
  return await getCategorias();
});

//obtener unidades de medida
ipcMain.handle("get-unidades-medida", async () => {
  return await getUnidades();
});

//insertar producto
ipcMain.handle("add-product", async (event, newProduct) => {
  try {
    const { data, error } = await supabaseClient
      .from("productos")
      .insert([newProduct])
      .select(); //select() devuelve el objeto creado
    console.log("Producto insertado:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Error al insertar:", error);
    return { success: false, error };
  }
});

//registrar salida
ipcMain.handle("registrar-salida", async (event, datos) => {
  try {
    const { data, error } = await supabaseClient.from("movimientos").insert([
      {
        // Asegúrate de que estos nombres sean idénticos a tu esquema de Supabase
        producto_id: datos.productoId, // El código que enviamos (ej: "003")
        tipo: "SALIDA",
        cantidad: datos.cantidad,
        estacion: datos.estacion,
        actividad: datos.actividad,
        observacion: datos.descripcion, // Verifica si en tu tabla es 'observacion' u 'observaciones'
        fecha: new Date().toISOString(),
      },
    ]);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

//obtener movimientos para el historial
// main.mjs

// Función para obtener el historial de movimientos
ipcMain.handle("obtener-movimientos", async () => {
  try {
    const { data, error } = await supabaseClient
      .from("movimientos")
      .select("*, productos(nombre)")
      .order("id", { ascending: false }) // Los más recientes primero
      .limit(10); // Solo mostramos los últimos 10 en el dashboard

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error al obtener movimientos:", error);
    return [];
  }
});

//funcion para obtener stock y alertas para el dashboard
ipcMain.handle("get-dashboard-stats", async () => {
  return await getDashboardStats();
});

const createWindow = () => {
  const win = new BrowserWindow({
    width: screen.getPrimaryDisplay().workArea.width,
    height: screen.getPrimaryDisplay().workArea.height,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  //Menu.setApplicationMenu(null)
  win.loadFile("index.html");
};

app.whenReady().then(() => {
  createWindow();
});

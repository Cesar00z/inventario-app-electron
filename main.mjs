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
ipcMain.handle("add-product", async (event, payload) => {
  try {
    //etraer la observación (si existe) para no enviarla a la tabla 'productos'
    const { observacion, ...newProduct } = payload;

    const { data, error } = await supabaseClient
      .from("productos")
      .insert([newProduct])
      .select(); //select() devuelve el objeto creado

    if (error) {
      console.error("Error al insertar producto:", error);
      return { success: false, error };
    }

    //registrar movimiento de ENTRADA si hay stock inicial
    if (newProduct.stock_actual > 0) {
      const { error: errMov } = await supabaseClient.from("movimientos").insert([{
        producto_id: newProduct.id,
        tipo: "ENTRADA",
        cantidad: newProduct.stock_actual,
        estacion: "Almacén Barcelona", // Valor por defecto
        actividad: "Ingreso inicial del producto",
        observacion: observacion || null,
        fecha: new Date().toISOString()
      }]);
      
      if (errMov) console.error("Error al registrar movimiento inicial:", errMov);
    }

    console.log("Producto insertado:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Error al insertar:", error);
    return { success: false, error };
  }
});

//eliminar producto definitivamente
ipcMain.handle("eliminar-producto", async (event, productoId) => {
  try {
    const { error } = await supabaseClient
      .from("productos")
      .delete()
      .eq("id", productoId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    return { success: false, error: error.message };
  }
});

//registrar salida
ipcMain.handle("registrar-salida", async (event, datos) => {
  try {
    // 1. Obtener el stock actual del producto
    const { data: producto, error: errGet } = await supabaseClient
      .from("productos")
      .select("stock_actual")
      .eq("id", datos.productoId)
      .single();

    if (errGet) {
      console.error("Error al obtener producto:", errGet);
      return { success: false, error: "Error al consultar el producto." };
    }

    const stockActual = parseFloat(producto.stock_actual) || 0;
    const cantidadRestar = parseFloat(datos.cantidad) || 0;
    const nuevoStock = stockActual - cantidadRestar;

    //verificar si hay stock suficiente
    if (nuevoStock < 0) {
      return { success: false, error: `Stock insuficiente. Stock actual: ${stockActual}` };
    }

    //actualizar el stock del producto restando la cantidad ingresada
    const { error: errUpdate } = await supabaseClient
      .from("productos")
      .update({ stock_actual: nuevoStock })
      .eq("id", datos.productoId);

    if (errUpdate) {
      console.error("Error al actualizar stock:", errUpdate);
      return { success: false, error: "Error al descontar el stock." };
    }

    //registrar el movimiento de salida
    const { data, error } = await supabaseClient.from("movimientos").insert([
      {
        producto_id: datos.productoId,
        tipo: "SALIDA",
        cantidad: cantidadRestar,
        estacion: datos.estacion,
        actividad: datos.actividad,
        observacion: datos.observacion || null,
        fecha: datos.fecha || new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Error al registrar salida:", error);
      return { success: false, error: error.message };
    }

    console.log(`Salida registrada y stock actualizado: ${stockActual} -> ${nuevoStock}`);
    return { success: true };
  } catch (err) {
    console.error("Error inesperado en registrar-salida:", err);
    return { success: false, error: err.message };
  }
});

//ontar total de movimientos por tipo (sin límite) para los contadores del dashboard
ipcMain.handle("contar-movimientos", async () => {
  try {
    const { count: totalSalidas, error: err1 } = await supabaseClient
      .from("movimientos")
      .select("*", { count: "exact", head: true })
      .eq("tipo", "SALIDA");

    const { count: totalEntradas, error: err2 } = await supabaseClient
      .from("movimientos")
      .select("*", { count: "exact", head: true })
      .eq("tipo", "ENTRADA");

    if (err1 || err2) throw err1 || err2;

    return { salidas: totalSalidas || 0, entradas: totalEntradas || 0 };
  } catch (error) {
    console.error("Error al contar movimientos:", error);
    return { salidas: 0, entradas: 0 };
  }
});

//obtener movimientos para el historial
// main.mjs

//función para obtener el historial de movimientos
ipcMain.handle("obtener-movimientos", async () => {
  try {
    const { data, error } = await supabaseClient
      .from("movimientos")
      .select("*, productos(nombre, unidades_medida(nombre_corto))")
      .order("id", { ascending: false }) //más recientes primero
      .limit(10);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error al obtener movimientos:", error);
    return [];
  }
});

//obtener top 3 productos con más salida
ipcMain.handle("obtener-top-productos", async () => {
  try {
    const { data, error } = await supabaseClient
      .from("movimientos")
      .select("cantidad, productos(id, nombre, categorias(nombre), unidades_medida(nombre_corto))")
      .eq("tipo", "SALIDA");

    if (error) throw error;

    //agrupar y sumar
    const agrupados = {};
    for (const mov of data) {
      if (!mov.productos) continue;
      const pid = mov.productos.id;
      if (!agrupados[pid]) {
        agrupados[pid] = {
          nombre: mov.productos.nombre,
          categoria: mov.productos.categorias?.nombre || "Sin categoría",
          unidad: mov.productos.unidades_medida?.nombre_corto || "und",
          totalSalida: 0
        };
      }
      agrupados[pid].totalSalida += (mov.cantidad || 0);
    }

    //ordenar y tomar los 3 primeros
    const top3 = Object.values(agrupados)
      .sort((a, b) => b.totalSalida - a.totalSalida)
      .slice(0, 3);

    return top3;
  } catch (error) {
    console.error("Error al obtener top productos:", error);
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

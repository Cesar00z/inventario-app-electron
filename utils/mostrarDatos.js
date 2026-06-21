import supabaseClient from "../lib/supabase.js";

//select tabla productos
export default async function getProductos() {
    try {
        const { data, error } = await supabaseClient.from("productos").select(`*, categorias(nombre), unidades_medida(nombre_corto)`) //iba eq.(estado)
        console.log("Productos obtenidos:", data);
        return data;
    } catch (error) {
        console.error("Error al obtener productos:", error);

        return [];
    }
  };
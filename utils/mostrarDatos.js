import supabaseClient from "../lib/supabase.js";

export default async function getProductos() {
    try {
        const { data, error } = await supabaseClient.from("productos").select(`*, categorias(nombre), unidades_medida(nombre_corto)`);
        console.log("Productos obtenidos:", data);
        return data;
    } catch (error) {
        console.error("Error al obtener productos:", error);

        return [];
    }
  };

// try {
//   const { data, error } = await supabaseClient.from("productos").select("*");

//   console.log("Datos obtenidos:", data);
// } catch (error) {
//   console.error("Error al obtener datos:", error);
// }

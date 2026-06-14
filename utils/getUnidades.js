import supabaseClient from "../lib/supabase.js";

export default async function getUnidades() {
     try {
        const { data, error } = await supabaseClient.from("unidades_medida").select(`id, nombre_corto`);
        console.log("Unidades de medida obtenidas:", data);
        return data;
    } catch (error) {
        console.error("Error al obtener unidades de medida:", error);
        return [];
    }
    
}
import supabaseClient from "../lib/supabase.js";

export default async function getCategorias() {
     try {
        const { data, error } = await supabaseClient.from("categorias").select(`id, nombre`);
        console.log("Categorías obtenidas:", data);
        return data;
    } catch (error) {
        console.error("Error al obtener categorías:", error);

        return [];
    }
}

// Función para obtener estadísticas del dashboard
import supabaseClient from "../lib/supabase.js";

export default async function getStock() {
    // 1. Obtener total de artículos
    try {
        const { count: totalArticulos, error: err1 } = await supabaseClient
            .from('productos')
            .select('*', { count: 'exact', head: true });
    
        // 2. Obtener productos con stock menor o igual al mínimo
        // Asumiendo que tus columnas se llaman 'stock' y 'stock_minimo'
        const { count: stockBajo, error: err2 } = await supabaseClient
            .from('productos')
            .select('*', { count: 'exact', head: true })
            .filter('stock_actual', 'lte', 'col.stock_minimo'); // Filtra donde stock <= stock_minimo
            return {
                total: totalArticulos || 0,
                alertas: stockBajo || 0
            };
        
    } catch (error) {
        
        if (err1 || err2) console.error("Error en stats:", err1 || err2);
    }


}

// Registrar el handler para el Dashboard

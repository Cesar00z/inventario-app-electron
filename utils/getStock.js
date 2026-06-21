import supabaseClient from "../lib/supabase.js";

export default async function getStock() {
    try {
        const { count: totalArticulos, error: err1 } = await supabaseClient
            .from('productos')
            .select('*', { count: 'exact', head: true })

        //contar productos con stock bajo
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


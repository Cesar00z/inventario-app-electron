//cambiar vistas entre inventario, dashboard y movimientos
document.addEventListener("DOMContentLoaded", () => {
  const menuItems = document.querySelectorAll(".menu-item");
  const btnDashboard = menuItems[0];
  const btnInventario = menuItems[1]; 
  const btnMovimientos = menuItems[2];

  const views = {
    dashboard: document.getElementById("dashboard-view"),
    inventory: document.getElementById("inventory-view"),
    movements: document.getElementById("movements-view"),
  };

  //mostrar vista seleccionada y ociltar las demas
  function showView(viewName) {
    //ocultar todas las vistas
    Object.values(views).forEach((view) => (view.style.display = "none"));
    menuItems.forEach((item) => item.classList.remove("active"));
    views[viewName].style.display = "block";

    //renderizar icono
    if (window.lucide) {
      lucide.createIcons();
    }
  }

  btnDashboard.addEventListener("click", (e) => {
    e.preventDefault();
    showView("dashboard");
    btnDashboard.classList.add("active");
  });

  btnInventario.addEventListener("click", (e) => {
    e.preventDefault();
    showView("inventory");
    btnInventario.classList.add("active");
  });

  btnMovimientos.addEventListener("click", (e) => {
    e.preventDefault();
    showView("movements");
    btnMovimientos.classList.add("active");
  });
});

//obtener datos de supabse y renderizar tabla dinamicamente
function renderInventory(products) {
  const tableBody = document.querySelector(".inventory-table tbody");
  if (!tableBody) return;
  //const isLowStock = product.stock_actual <= product.stock_minimo;
  //const statusClass = isLowStock ? 'status-low' : 'status-ok';
  //const statusText = isLowStock ? '● Crítico' : '● Óptimo';
  tableBody.innerHTML = products
    .map(
      (product) => `
        <tr>
            <td>${product.codigo}</td>
            <td>${product.nombre}</td>
            <td>${product.categorias.nombre}</td>
          <td>${product.stock_actual} ${product.unidades_medida.nombre_corto}</td>
            </tr>
    `,
    )
    .join("");
}


document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM Cargado, pidiendo datos...");

  try {
    //pedir productos al main process
    const productos = await window.api.pedirProductos();

    console.log("Datos recibidos en el renderer:", productos);

    if (productos && productos.length > 0) {
      renderInventory(productos);
    } else {
      console.warn("La base de datos devolvió un array vacío.");
    }
  } catch (error) {
    console.error("Error al pedir productos:", error);
  }
});

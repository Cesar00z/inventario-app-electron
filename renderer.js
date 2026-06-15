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
            <td>${product.id}</td>
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

//Agregar producto
async function cargarCatalogosModal() {
  const categorias = await window.api.pedirCategorias();
  const unidades = await window.api.pedirUnidades();

  const selectCat = document.getElementById("modal-categoria");
  const selectUni = document.getElementById("modal-unidad");

  if (selectCat) {
    selectCat.innerHTML = categorias
      .map((c) => `<option value="${c.id}">${c.nombre}</option>`)
      .join("");
  }

  if (selectUni) {
    selectUni.innerHTML = unidades
      .map((u) => `<option value="${u.id}">${u.nombre_corto}</option>`)
      .join("");
  }
}

//Evento para el botón "Añadir Producto" de la Modal
const btnGuardar = document.querySelector(".btn-primary-modal"); // Ajusta al ID de tu botón azul
btnGuardar.addEventListener("click", async () => {
  const nuevoProducto = {
    id: document.getElementById("input-codigo").value,
    nombre: document.getElementById("input-nombre").value,
    categoria_id: parseInt(document.getElementById("modal-categoria").value),
    unidad_id: parseInt(document.getElementById("modal-unidad").value),
    stock_actual:
      parseFloat(document.getElementById("input-stock-inicial").value) || 0,
    stock_minimo:
      parseFloat(document.getElementById("input-stock-minimo").value) || 1,
    ultima_actualizacion: new Date().toISOString(),
  };

  const resultado = await window.api.agregarProducto(nuevoProducto);

  if (resultado.success) {
    alert("¡Producto agregado con éxito!");
    console.log(resultado)
    // Ocultar modal (ajusta a como manejes tus clases de CSS)
    document.getElementById("modal-registro").classList.remove("active");
    //input.value = ''
    // RECARGAR LA TABLA AUTOMÁTICAMENTE
    const productosActualizados = await window.api.pedirProductos();
    renderInventory(productosActualizados);
    actualizarDashboard(); // Refrescar números del dashboard
  } else {
    alert("Error al guardar: " + resultado.error.message);
  }
});

//codigo del modal
// Seleccionar elementos
const modal = document.getElementById("modal-registro");
const btnAbrirModal = document.querySelector(".btn-primary"); // El botón de "Registrar Inventario"
const btnCerrar = document.getElementById("btn-cerrar-modal");
const btnCancelar = document.getElementById("btn-cancelar-modal");

// Abrir Modal
btnAbrirModal.addEventListener("click", () => {
  // Solo abrir si estamos en la sección de inventario
  if (document.getElementById("inventory-view").style.display !== "none") {
    modal.classList.add("active");
    cargarCatalogosModal(); // Tu función existente para llenar selects
  }
});

// Cerrar Modal (Equis y Cancelar)
[btnCerrar, btnCancelar].forEach((btn) => {
  btn.addEventListener("click", () => {
    modal.classList.remove("active");
  });
});

// Cerrar si hace clic fuera del contenido blanco
window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.remove("active");
  }
});

//segunda oopcion
async function actualizarDashboard() {

  try {
    const productos = await window.api.pedirProductos();
    const movimientos = await window.api.obtenerMovimientos();

    if (!productos || !movimientos) return;

    // 1. Total Artículos y Alertas (Tu lógica actual que está perfecta)
    document.getElementById("total-articulos").innerText = productos.length;
    const numAlertas = productos.filter(
      (p) => Number(p.stock_actual) <= Number(p.stock_minimo),
    ).length;
    const elAlertas = document.getElementById("alertas-stock");
    elAlertas.innerText = numAlertas;
    elAlertas.style.color = numAlertas > 0 ? "#ff4d4d" : "inherit";

    // 2. CONTADORES DE TRANSACCIONES (Lo nuevo)
    const entradasMes = movimientos.filter((m) => m.tipo === "ENTRADA").length;
    const salidasMes = movimientos.filter((m) => m.tipo === "SALIDA").length;

    // Asegúrate de que estos IDs existan en tu index.html
    const elEntradas = document.getElementById("entradas-mes");
    const elSalidas = document.getElementById("salidas-mes");

    if (elEntradas) elEntradas.innerText = entradasMes;
    if (elSalidas) elSalidas.innerText = salidasMes;

    console.log("Dashboard y Transacciones actualizados.");
  } catch (error) {
    console.error("Error en dashboard:", error);
  }
}

async function llenarSelectProductos() {
  const selectProd = document.getElementById("select-producto-salida");
  const productos = await window.api.pedirProductos();

  selectProd.innerHTML = '<option value="">Seleccione un producto...</option>';

  productos.forEach((p) => {
    const option = document.createElement("option");
    // CAMBIO VITAL: Usar p.id porque es tu Llave Primaria
    option.value = p.id;
    option.textContent = `[${p.id}] ${p.nombre} - (Stock: ${p.stock_actual} und)`;
    option.dataset.stock = p.stock_actual;
    selectProd.appendChild(option);
  });
  console.log("Select de productos cargado con IDs.");
}

document.addEventListener("DOMContentLoaded", () => {
  const modalSalida = document.getElementById("modal-salida");
  const btnAbrir = document.getElementById("btn-registrar-salida");
  const btnCerrar = document.getElementById("btn-cancelar-salida");
  const btnCerrarX = document.getElementById("btn-cerrar-x-salida");

  if (btnAbrir) {
    btnAbrir.addEventListener("click", () => {
      console.log("Abriendo modal de salida..."); // Para debuguear en la consola
      modalSalida.classList.add("active");
      // Aprovecha para llenar los selects de productos si es necesario
      llenarSelectProductos();
    });
  }

  [btnCerrar, btnCerrarX].forEach((btn) => {
    if (btn)
      btn.addEventListener("click", () =>
        modalSalida.classList.remove("active"),
      );
  });
  const selectProd = document.getElementById("select-producto-salida");
  const inputCant = document.getElementById("cantidad-salida");

  function actualizarPreview() {
    const option = selectProd.options[selectProd.selectedIndex];
    const stockActual = parseFloat(option.dataset.stock) || 0;
    const cantidad = parseFloat(inputCant.value) || 0;

    document.getElementById("preview-stock-actual").innerText = stockActual;
    document.getElementById("preview-nuevo-stock").innerText =
      stockActual - cantidad;
  }

  selectProd.addEventListener("change", actualizarPreview);
  inputCant.addEventListener("input", actualizarPreview);

  // Cerrar si hacen clic fuera del contenido blanco
  window.addEventListener("click", (event) => {
    if (event.target == modalSalida) {
      modalSalida.classList.remove("active");
    }
  });
});

//modal y funcionalidad de registrar salida
const btnConfirmar = document.getElementById("btn-confirmar-salida");

btnConfirmar.addEventListener("click", async () => {
  const selectElement = document.getElementById("select-producto-salida");
  const codigoProducto = selectElement.value; // Esto ahora capturará el código (ej: "007123")

  console.log("Código de producto capturado:", codigoProducto);

  if (!codigoProducto) {
    alert("Por favor, selecciona un producto.");
    return;
  }

  const datosSalida = {
    productoId: codigoProducto, // Se envía el código de texto a la columna producto_id
    cantidad: parseFloat(document.getElementById("cantidad-salida").value),
    estacion: document.getElementById("estacion-destino").value,
    actividad: document.getElementById("motivo-salida").value,
    descripcion: document.getElementById("obs-salida").value,
  };

  const resultado = await window.api.registrarSalida(datosSalida);

  if (resultado.success) {
    alert("Salida registrada correctamente");

    // OCULTAR MODAL
    document.getElementById("modal-salida").classList.remove("active");

    // REFRESCAR DATOS (Esto es lo que hace que el trigger se note en pantalla)
    const productosActualizados = await window.api.pedirProductos();
    renderInventory(productosActualizados); // Actualiza la tabla
    await actualizarInterfaz();
    await actualizarDashboard(); // Actualiza los contadores y alertas
  } else {
    // Si el trigger de Supabase lanza el error de "Stock insuficiente", aparecerá aquí
    alert("Error: " + resultado.error);
  }
});

// renderer.js

// Esta función debe ejecutarse al cargar la página y después de cada registro
async function actualizarInterfaz() {
  console.log("Refrescando datos de la interfaz...");

  // 1. Obtener movimientos actualizados desde Supabase
  const movimientos = await window.api.obtenerMovimientos();
  const historialTabla = document.getElementById("movements-tbody");

  if (historialTabla) {
    historialTabla.innerHTML = ""; // Limpiamos la tabla actual

    movimientos.forEach((mov) => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
                <td>${new Date(mov.fecha).toLocaleDateString()}</td>
                <td><span class="badge ${mov.tipo === "SALIDA" ? "bg-danger" : "bg-success"}">${mov.tipo}</span></td>
                <td>${mov.productos?.nombre || mov.producto_id}</td>
                <td>${mov.cantidad}</td>
                <td>${mov.estacion || mov.actividad}</td>
            `;
      historialTabla.appendChild(fila);
    });
  }

  // 2. Actualizar contadores del Dashboard
  // Aquí llamarías a la función que ya tienes para los indicadores
  // if (typeof actualizarContadoresDashboard === "function") {
  //   actualizarDashboard2();
  // }
}

document.addEventListener("DOMContentLoaded", async () => {
  await actualizarInterfaz();
  await actualizarDashboard();
});

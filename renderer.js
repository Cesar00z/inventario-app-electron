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

  tableBody.innerHTML = products
    .map((product) => {
      const isLowStock =
        Number(product.stock_actual) <= Number(product.stock_minimo);
      const statusClass = isLowStock ? "status-low" : "status-ok";
      const statusText = isLowStock ? "● Crítico" : "● Óptimo";
      return `
        <tr>
          <td class="text-muted">${product.id}</td>
          <td>${product.nombre}</td>
          <td><span class="badge2">${product.categorias.nombre}</span></td>
          <td>${product.stock_actual} <span class="unit">${product.unidades_medida.nombre_corto}</span></td>
          <td><span class="${statusClass}">${statusText}</span></td>
          <td>
            <div class="action-buttons">
              <button class="btn-action in" title="Registrar Entrada"><i data-lucide="arrow-down-left"></i></button>
              <button class="btn-action out" title="Registrar Salida"><i data-lucide="arrow-up-right"></i></button>
              <button class="btn-action delete" data-id="${product.id}" data-nombre="${product.nombre}" title="Eliminar Producto"><i data-lucide="trash-2"></i></button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  // Re-renderizar iconos de Lucide para las filas nuevas
  if (window.lucide) lucide.createIcons();
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
  const codigo = String(document.getElementById("input-codigo").value).trim();
  const nombre = document.getElementById("input-nombre").value.trim();

  // Validación: No permitir guardar si el código o el nombre están vacíos
  if (!codigo || !nombre) {
    alert("Por favor, ingrese el Código y el Nombre del producto.");
    return;
  }

  const nuevoProducto = {
    id: codigo,
    nombre: nombre,
    categoria_id: parseInt(document.getElementById("modal-categoria").value),
    unidad_id: parseInt(document.getElementById("modal-unidad").value),
    stock_actual:
      parseFloat(document.getElementById("input-stock-inicial").value) || 0,
    stock_minimo:
      parseFloat(document.getElementById("input-stock-minimo").value) || 0,
    ultima_actualizacion: new Date().toISOString(),
    observacion: document.getElementById("input-observacion-producto").value.trim(),
  };

  const resultado = await window.api.agregarProducto(nuevoProducto);

  if (resultado.success) {
    console.log(resultado);
    // Ocultar modal primero para evitar bugs visuales
    document.getElementById("modal-registro").classList.remove("active");
    
    // Limpiar formulario
    document.getElementById("input-codigo").value = "";
    document.getElementById("input-nombre").value = "";
    document.getElementById("input-stock-inicial").value = "0";
    document.getElementById("input-stock-minimo").value = "0";
    document.getElementById("input-observacion-producto").value = "";
    
    // Reiniciar los select a su primera opción
    const selectCat = document.getElementById("modal-categoria");
    if (selectCat && selectCat.options.length > 0) selectCat.selectedIndex = 0;
    
    const selectUni = document.getElementById("modal-unidad");
    if (selectUni && selectUni.options.length > 0) selectUni.selectedIndex = 0;
    
    // RECARGAR LA TABLA AUTOMÁTICAMENTE
    const productosActualizados = await window.api.pedirProductos();
    renderInventory(productosActualizados);
    actualizarDashboard(); // Refrescar números del dashboard
    await actualizarInterfaz(); // Refrescar historial de movimientos

    // Mostrar notificación Toast en lugar de alert() nativo para evitar el bug de foco en Electron
    mostrarNotificacion("¡Producto agregado con éxito!");
  } else {
    alert("Error al guardar: " + resultado.error.message);
  }
});

// Función para mostrar notificaciones sin bloquear la pantalla (Toast)
function mostrarNotificacion(mensaje) {
  const toast = document.createElement("div");
  toast.innerText = mensaje;
  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.right = "20px";
  toast.style.backgroundColor = "#10b981"; // Verde de éxito
  toast.style.color = "white";
  toast.style.padding = "12px 24px";
  toast.style.borderRadius = "8px";
  toast.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
  toast.style.zIndex = "9999";
  toast.style.fontFamily = "system-ui, sans-serif";
  toast.style.transition = "opacity 0.3s ease";

  document.body.appendChild(toast);

  // Desaparecer después de 3 segundos
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

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
    
    // Enfocar automáticamente el input del código al abrir el modal
    setTimeout(() => {
      document.getElementById("input-codigo").focus();
    }, 50);
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

    if (!productos) return;

    // 1. Total Artículos y Alertas (Suma de todo el stock de todos los productos)
    const totalStock = productos.reduce((sum, p) => sum + (Number(p.stock_actual) || 0), 0);
    document.getElementById("total-articulos").innerText = totalStock;
    const numAlertas = productos.filter(
      (p) => Number(p.stock_actual) <= Number(p.stock_minimo),
    ).length;
    const elAlertas = document.getElementById("alertas-stock");
    elAlertas.innerText = numAlertas;
    elAlertas.style.color = numAlertas > 0 ? "#ff4d4d" : "inherit";

    // 2. CONTADORES DE TRANSACCIONES — consulta el total real sin límite de 10
    const contadores = await window.api.contarMovimientos();

    const elEntradas = document.getElementById("entradas-mes");
    const elSalidas = document.getElementById("salidas-mes");

    if (elEntradas) elEntradas.innerText = contadores.entradas;
    if (elSalidas) elSalidas.innerText = contadores.salidas;

    // 3. Movimientos Recientes en Dashboard
    const movimientos = await window.api.obtenerMovimientos();
    const dashboardMovs = document.getElementById("dashboard-movements-tbody");
    if (dashboardMovs) {
      dashboardMovs.innerHTML = "";
      movimientos.forEach((mov) => {
        const fila = document.createElement("tr");
        const observacion = mov.observacion ? ` - ${mov.observacion}` : "";
        fila.innerHTML = `
          <td>${new Date(mov.fecha).toLocaleDateString()} ${new Date(mov.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
          <td><span class="badge ${mov.tipo === "SALIDA" ? "bg-danger" : "bg-success"}">${mov.tipo}</span></td>
          <td>${mov.productos?.nombre || mov.producto_id}</td>
          <td>${mov.cantidad} ${mov.productos?.unidades_medida?.nombre_corto || ""}</td>
          <td><strong>${mov.actividad || mov.estacion}</strong><br><span class="obs-text">${mov.estacion}${observacion}</span></td>
        `;
        dashboardMovs.appendChild(fila);
      });
    }

    // 4. Top 3 Productos
    const topProductos = await window.api.obtenerTopProductos();
    const dashboardTop = document.getElementById("dashboard-top-products");
    if (dashboardTop) {
      dashboardTop.innerHTML = "";
      topProductos.forEach((prod, index) => {
        const div = document.createElement("div");
        div.className = "product-item";
        div.innerHTML = `
          <div class="rank">#${index + 1}</div>
          <div class="product-info">
            <p class="p-name">${prod.nombre}</p>
            <p class="p-cat">${prod.categoria}</p>
          </div>
          <div class="product-qty">
            <span class="qty-num">${prod.totalSalida}</span>
            <span class="qty-unit">${(prod.unidad || "UND").toUpperCase()}</span>
          </div>
        `;
        dashboardTop.appendChild(div);
      });
    }

    console.log("Dashboard actualizado:", contadores);
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
    option.value = p.id;
    const unidad = p.unidades_medida?.nombre_corto || "und";
    option.textContent = `[${p.id}] ${p.nombre} - (Stock: ${p.stock_actual} ${unidad})`;
    option.dataset.stock = p.stock_actual;
    option.dataset.unidad = unidad;
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
    const unidad = option.dataset.unidad || "und";
    const cantidad = parseFloat(inputCant.value) || 0;

    document.getElementById("preview-stock-actual").innerText = stockActual;
    document.getElementById("preview-nuevo-stock").innerText =
      stockActual - cantidad;
    const elUnidad = document.getElementById("preview-unidad");
    if (elUnidad) elUnidad.innerText = unidad;
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
  const codigoProducto = selectElement.value; //captura el codigo del producto

  console.log("Código de producto capturado:", codigoProducto);

  if (!codigoProducto) {
    alert("Por favor, selecciona un producto.");
    return;
  }

  const datosSalida = {
    productoId: codigoProducto,
    cantidad: parseFloat(document.getElementById("cantidad-salida").value),
    estacion: document.getElementById("estacion-destino").value,
    actividad: document.getElementById("motivo-salida").value,
    fecha: document.getElementById("fecha-salida").value ? new Date(document.getElementById("fecha-salida").value).toISOString() : null,
    observacion: document.getElementById("observacion-salida").value.trim(),
  };

  const resultado = await window.api.registrarSalida(datosSalida);

  if (resultado.success) {
    alert("Salida registrada correctamente");

    // LIMPIAR FORMULARIO
    document.getElementById("cantidad-salida").value = "1";
    document.getElementById("estacion-destino").value = "";
    document.getElementById("fecha-salida").value = "";
    document.getElementById("observacion-salida").value = "";
    document.getElementById("select-producto-salida").selectedIndex = 0;
    document.getElementById("motivo-salida").selectedIndex = 0;

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


//funcion para obtener los movimientos actualizados
async function actualizarInterfaz() {
  console.log("Refrescando datos de la interfaz...");

  const movimientos = await window.api.obtenerMovimientos();
  const historialTabla = document.getElementById("movements-tbody");

  if (historialTabla) {
    historialTabla.innerHTML = ""; //limpiar tabla

      movimientos.forEach((mov) => {
        const fila = document.createElement("tr");
        const observacion = mov.observacion ? ` - ${mov.observacion}` : "";
        fila.innerHTML = `
                <td>${new Date(mov.fecha).toLocaleDateString()} ${new Date(mov.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                <td><span class="badge ${mov.tipo === "SALIDA" ? "bg-danger" : "bg-success"}">${mov.tipo}</span></td>
                <td>${mov.productos?.nombre || mov.producto_id}</td>
                <td>${mov.cantidad} ${mov.productos?.unidades_medida?.nombre_corto || ""}</td>
                <td><strong>${mov.actividad || mov.estacion}</strong><br><span class="obs-text">${mov.estacion}${observacion}</span></td>
            `;
        historialTabla.appendChild(fila);
      });
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await actualizarInterfaz();
  await actualizarDashboard();
});

// Listener de eliminación de producto (delegación de eventos en la tabla)
document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.querySelector(".inventory-table tbody");
  if (!tableBody) return;

  tableBody.addEventListener("click", async (e) => {
    const btnEliminar = e.target.closest(".btn-action.delete");
    if (!btnEliminar) return;

    const productoId = btnEliminar.dataset.id;
    const productoNombre = btnEliminar.dataset.nombre;

    const confirmar = confirm(
      `¿Estás seguro de que deseas eliminar el producto "${productoNombre}" (${productoId})?\n\nEsta acción no se puede deshacer.`,
    );
    if (!confirmar) return;

    const resultado = await window.api.eliminarProducto(productoId);

    if (resultado.success) {
      // Eliminar la fila visualmente sin recargar toda la tabla
      btnEliminar.closest("tr").remove();
      await actualizarDashboard();
    } else {
      alert("Error al eliminar el producto: " + resultado.error);
    }
  });
});

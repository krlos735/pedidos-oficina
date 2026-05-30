import { loginConRut, getUsuarioActual, setUsuarioActual, guardarSesion, cargarSesion, cerrarSesion, initRutInput } from './auth.js';
import { verificarCumpleHoy, getProximoCumple } from './cumples.js';
import { getLocales, getMenuLocal, MENU_FUENTE_ALEMANA, getMenuLocalFlat, importarMenu } from './menu.js';
import { getCarrito, agregarAlCarrito, eliminarDelCarrito, getTotalCarrito, getCountCarrito, limpiarCarrito, confirmarPedido, getPedidosUsuario } from './pedidos.js';
import { formatPrecio, formatFecha, show, hide } from './utils.js';
import { initAdminTabs, cargarTabActivo, initFormCumple, initFormUsuario, initImportarMenu } from './admin.js';

// ── ESTADO DE LA APP ──
let menuActual = {};       // grupos de ítems por categoría
let localActual = null;    // local seleccionado
let itemSeleccionado = null;
let categoriaActiva = null;

// ── INIT ──
document.addEventListener('DOMContentLoaded', async () => {
  initRutInput();
  initLoginBtn();

  // Verificar sesión existente
  const sesion = cargarSesion();
  if (sesion) {
    setUsuarioActual(sesion);
    if (sesion.rol === 'admin') {
      mostrarAdmin();
    } else {
      await mostrarApp();
    }
  }
});

// ── LOGIN ──
function initLoginBtn() {
  document.getElementById('btn-login').addEventListener('click', async () => {
    const rut = document.getElementById('rut-input').value;
    const errorEl = document.getElementById('login-error');
    hide(errorEl);

    if (!rut || rut.length < 5) {
      show(errorEl);
      errorEl.textContent = 'Ingresa un RUT válido.';
      return;
    }

    const btn = document.getElementById('btn-login');
    btn.textContent = 'Verificando...';
    btn.disabled = true;

    try {
      const usuario = await loginConRut(rut);
      if (!usuario) {
        show(errorEl);
        errorEl.textContent = 'RUT no encontrado. Contacta al admin.';
      } else {
        setUsuarioActual(usuario);
        guardarSesion(usuario);
        if (usuario.rol === 'admin') {
          mostrarAdmin();
        } else {
          await mostrarApp();
        }
      }
    } catch (e) {
      show(errorEl);
      errorEl.textContent = 'Error de conexión. Intenta de nuevo.';
    }

    btn.textContent = 'Entrar';
    btn.disabled = false;
  });
}

// ── APP USUARIO ──
async function mostrarApp() {
  const usuario = getUsuarioActual();
  hide(document.getElementById('screen-login'));
  show(document.getElementById('screen-app'));
  document.getElementById('screen-app').classList.add('active');

  document.getElementById('header-username').textContent = usuario.nombre;

  // Logout
  document.getElementById('btn-logout').addEventListener('click', () => {
    cerrarSesion();
    location.reload();
  });

  // Historial
  document.getElementById('btn-historial').addEventListener('click', () => abrirHistorial());
  document.getElementById('btn-cerrar-historial').addEventListener('click', () => hide(document.getElementById('modal-historial')));

  // Verificar cumpleaños
  const { activo, nombre } = await verificarCumpleHoy();

  if (!activo) {
    show(document.getElementById('estado-bloqueado'));
    const proximo = await getProximoCumple();
    if (proximo) {
      const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
      document.getElementById('estado-mensaje').textContent = 'El menú se habilita en días de cumpleaños.';
      document.getElementById('proximo-cumple').innerHTML =
        `🎂 Próximo: <strong>${proximo.nombre}</strong> — celebramos el ${formatFecha(proximo.fechaCelebracion)}`;
    }
  } else {
    hide(document.getElementById('estado-bloqueado'));
    show(document.getElementById('estado-activo'));
    document.getElementById('cumple-texto').textContent = `¡Hoy celebramos a ${nombre}! 🎂`;
    await cargarLocales();
  }
}

// ── LOCALES ──
async function cargarLocales() {
  show(document.getElementById('seccion-locales'));
  const listaEl = document.getElementById('lista-locales');
  listaEl.innerHTML = '<p style="color:var(--text2);font-size:.85rem">Cargando...</p>';

  let locales = await getLocales();

  // Si no hay locales en Firestore, usar el de respaldo
  if (locales.length === 0) {
    locales = [{ id: 'fuente-alemana', nombre: 'Fuente Alemana', descripcion: 'Concepción · Completos y sándwiches', emoji: '🌭' }];
  }

  listaEl.innerHTML = locales.map(l => `
    <div class="local-card" data-id="${l.id}" data-nombre="${l.nombre}">
      <span class="local-icon">${l.emoji || '🍽️'}</span>
      <span class="local-nombre">${l.nombre}</span>
      <span class="local-desc">${l.descripcion || ''}</span>
    </div>
  `).join('');

  listaEl.querySelectorAll('.local-card').forEach(card => {
    card.addEventListener('click', () => seleccionarLocal(card.dataset.id, card.dataset.nombre));
  });
}

// ── MENÚ DEL LOCAL ──
async function seleccionarLocal(localId, localNombre) {
  localActual = { id: localId, nombre: localNombre };
  hide(document.getElementById('seccion-locales'));
  show(document.getElementById('seccion-menu'));
  document.getElementById('menu-local-nombre').textContent = localNombre;

  const catEl = document.getElementById('lista-categorias');
  const itemsEl = document.getElementById('lista-items');
  catEl.innerHTML = '<span style="color:var(--text2);font-size:.85rem">Cargando menú...</span>';
  itemsEl.innerHTML = '';

  let grupos = await getMenuLocal(localId);

  // Si no hay nada en Firestore, usar el menú de respaldo y cargarlo
  if (Object.keys(grupos).length === 0) {
    await importarMenu(localId, MENU_FUENTE_ALEMANA);
    grupos = await getMenuLocal(localId);
  }

  menuActual = grupos;
  const categorias = Object.keys(grupos);
  categoriaActiva = categorias[0];

  catEl.innerHTML = categorias.map(cat => `
    <button class="cat-tab ${cat === categoriaActiva ? 'active' : ''}" data-cat="${cat}">${cat}</button>
  `).join('');

  catEl.querySelectorAll('.cat-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      catEl.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      categoriaActiva = tab.dataset.cat;
      renderItems(grupos[categoriaActiva]);
    });
  });

  renderItems(grupos[categoriaActiva]);

  document.getElementById('btn-volver-locales').addEventListener('click', () => {
    hide(document.getElementById('seccion-menu'));
    show(document.getElementById('seccion-locales'));
    limpiarCarrito();
    actualizarCarritoFAB();
  });
}

function renderItems(items) {
  const el = document.getElementById('lista-items');
  el.innerHTML = items.map(item => `
    <div class="item-card" data-id="${item.id}">
      <div class="item-img">${item.emoji || '🍽️'}</div>
      <div class="item-info">
        <div class="item-nombre">${item.nombre}</div>
        <div class="item-desc">${item.descripcion || ''}</div>
        <div class="item-precio">${formatPrecio(item.precio)}</div>
      </div>
    </div>
  `).join('');

  el.querySelectorAll('.item-card').forEach(card => {
    card.addEventListener('click', () => {
      const allItems = Object.values(menuActual).flat();
      const item = allItems.find(i => i.id === card.dataset.id);
      if (item) abrirModalItem(item);
    });
  });
}

// ── MODAL ÍTEM ──
function abrirModalItem(item) {
  itemSeleccionado = item;
  document.getElementById('modal-item-nombre').textContent = item.nombre;
  document.getElementById('modal-item-desc').textContent = item.descripcion || '';
  document.getElementById('modal-item-precio').textContent = formatPrecio(item.precio);
  document.getElementById('modal-item-img').innerHTML = item.emoji || '🍽️';
  document.getElementById('modal-comentario-input').value = '';
  document.getElementById('modal-qty-val').textContent = '1';
  show(document.getElementById('modal-item'));
}

document.getElementById('btn-cerrar-item').addEventListener('click', () => hide(document.getElementById('modal-item')));
document.getElementById('modal-item').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modal-item')) hide(document.getElementById('modal-item'));
});

let qty = 1;
document.getElementById('btn-qty-menos').addEventListener('click', () => {
  qty = Math.max(1, qty - 1);
  document.getElementById('modal-qty-val').textContent = qty;
});
document.getElementById('btn-qty-mas').addEventListener('click', () => {
  qty = Math.min(10, qty + 1);
  document.getElementById('modal-qty-val').textContent = qty;
});

document.getElementById('btn-agregar-item').addEventListener('click', () => {
  if (!itemSeleccionado) return;
  const comentario = document.getElementById('modal-comentario-input').value.trim();
  qty = parseInt(document.getElementById('modal-qty-val').textContent);
  agregarAlCarrito(itemSeleccionado, qty, comentario);
  qty = 1;
  hide(document.getElementById('modal-item'));
  actualizarCarritoFAB();
});

// ── CARRITO FAB ──
function actualizarCarritoFAB() {
  const count = getCountCarrito();
  const fab = document.getElementById('carrito-fab');
  if (count > 0) {
    show(fab);
    document.getElementById('carrito-count').textContent = count;
    document.getElementById('carrito-total-fab').textContent = formatPrecio(getTotalCarrito());
  } else {
    hide(fab);
  }
}

document.getElementById('btn-ver-carrito').addEventListener('click', () => abrirCarrito());

// ── MODAL CARRITO ──
function abrirCarrito() {
  renderCarrito();
  show(document.getElementById('modal-carrito'));
}

function renderCarrito() {
  const lista = document.getElementById('carrito-items-lista');
  const carrito = getCarrito();

  if (carrito.length === 0) {
    lista.innerHTML = '<p style="color:var(--text2);text-align:center;padding:1rem">El carrito está vacío</p>';
  } else {
    lista.innerHTML = carrito.map((c, i) => `
      <div class="carrito-item">
        <div class="carrito-item-info">
          <div class="carrito-item-nombre">${c.emoji} ${c.nombre} x${c.cantidad}</div>
          ${c.comentario ? `<div class="carrito-item-comentario">💬 ${c.comentario}</div>` : ''}
        </div>
        <span class="carrito-item-precio">${formatPrecio(c.precio * c.cantidad)}</span>
        <button class="carrito-item-del" data-index="${i}">✕</button>
      </div>
    `).join('');

    lista.querySelectorAll('.carrito-item-del').forEach(btn => {
      btn.addEventListener('click', () => {
        eliminarDelCarrito(parseInt(btn.dataset.index));
        renderCarrito();
        actualizarCarritoFAB();
      });
    });
  }

  document.getElementById('carrito-total-modal').textContent = formatPrecio(getTotalCarrito());
}

document.getElementById('btn-cerrar-carrito').addEventListener('click', () => hide(document.getElementById('modal-carrito')));
document.getElementById('modal-carrito').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modal-carrito')) hide(document.getElementById('modal-carrito'));
});

document.getElementById('btn-confirmar-pedido').addEventListener('click', async () => {
  const usuario = getUsuarioActual();
  if (getCarrito().length === 0) return;

  const btn = document.getElementById('btn-confirmar-pedido');
  btn.textContent = 'Confirmando...';
  btn.disabled = true;

  try {
    await confirmarPedido(usuario.id, usuario.nombre, localActual.id, localActual.nombre);
    hide(document.getElementById('modal-carrito'));
    actualizarCarritoFAB();
    alert('✓ Pedido confirmado. ¡Buen provecho!');
  } catch (e) {
    alert('Error al confirmar: ' + e.message);
  }

  btn.textContent = 'Confirmar pedido';
  btn.disabled = false;
});

// ── HISTORIAL ──
async function abrirHistorial() {
  const usuario = getUsuarioActual();
  const lista = document.getElementById('historial-lista');
  lista.innerHTML = '<p style="color:var(--text2);text-align:center">Cargando...</p>';
  show(document.getElementById('modal-historial'));

  const pedidos = await getPedidosUsuario(usuario.id);

  if (pedidos.length === 0) {
    lista.innerHTML = '<p style="color:var(--text2);text-align:center;padding:1rem">Aún no tienes pedidos.</p>';
    return;
  }

  lista.innerHTML = pedidos.map(p => {
    const fecha = p.fecha?.toDate ? p.fecha.toDate() : new Date(p.fecha);
    return `
      <div class="historial-item">
        <div class="historial-item-header">
          <span class="historial-fecha">${formatFecha(fecha)} · ${p.localNombre}</span>
          <span class="historial-total">${formatPrecio(p.total)}</span>
        </div>
        <div class="historial-items-list">
          ${p.items.map(i => `${i.emoji} ${i.nombre} x${i.cantidad}${i.comentario ? ` (${i.comentario})` : ''}`).join(' · ')}
        </div>
      </div>
    `;
  }).join('');
}

document.getElementById('modal-historial').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modal-historial')) hide(document.getElementById('modal-historial'));
});

// ── ADMIN ──
function mostrarAdmin() {
  hide(document.getElementById('screen-login'));
  show(document.getElementById('screen-admin'));
  document.getElementById('screen-admin').classList.add('active');

  initAdminTabs();
  initFormCumple();
  initFormUsuario();
  initImportarMenu();
  cargarTabActivo('pedidos');

  document.getElementById('btn-admin-logout').addEventListener('click', () => {
    cerrarSesion();
    location.reload();
  });
}

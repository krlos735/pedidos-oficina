import { db } from './firebase.js';
import { collection, addDoc, deleteDoc, doc, getDocs, query, orderBy }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { cleanRut, formatRut, formatPrecio, formatFecha, show, hide } from './utils.js';
import { getCumpleanos, agregarCumpleanos, eliminarCumpleanos, diaCelebracion, esMismoDia } from './cumples.js';
import { getPedidosHoy } from './pedidos.js';
import { getMenuLocalFlat, importarMenu, eliminarMenuItem, MENU_FUENTE_ALEMANA } from './menu.js';

// ── TABS ──
export function initAdminTabs() {
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.admin-panel').forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
      });
      tab.classList.add('active');
      const panel = document.getElementById(`tab-${tab.dataset.tab}`);
      panel.classList.add('active');
      panel.style.display = 'block';
      cargarTabActivo(tab.dataset.tab);
    });
  });
}

export function cargarTabActivo(tab) {
  if (tab === 'pedidos') cargarPedidosAdmin();
  if (tab === 'cumples') cargarCumplesAdmin();
  if (tab === 'usuarios') cargarUsuariosAdmin();
  if (tab === 'menu') cargarMenuAdmin();
}

// ── PEDIDOS ──
export async function cargarPedidosAdmin() {
  const lista = document.getElementById('pedidos-lista');
  const vacio = document.getElementById('pedidos-vacio');
  const fechaBadge = document.getElementById('pedidos-fecha');

  fechaBadge.textContent = new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
  lista.innerHTML = '<p style="color:var(--text2);font-size:.85rem">Cargando...</p>';

  const pedidos = await getPedidosHoy();

  if (pedidos.length === 0) {
    lista.innerHTML = '';
    show(vacio);
    return;
  }
  hide(vacio);

  lista.innerHTML = pedidos.map(p => `
    <div class="pedido-card-admin">
      <div class="pedido-admin-header">
        <span class="pedido-admin-nombre">👤 ${p.nombreUsuario}</span>
        <span class="pedido-admin-total">${formatPrecio(p.total)}</span>
      </div>
      <div class="pedido-admin-items">
        ${p.items.map(i =>
          `${i.emoji} ${i.nombre} x${i.cantidad}${i.comentario ? ` <em>(${i.comentario})</em>` : ''} — ${formatPrecio(i.precio * i.cantidad)}`
        ).join('<br>')}
      </div>
    </div>
  `).join('');
}

// ── CUMPLEAÑOS ──
export async function cargarCumplesAdmin() {
  const lista = document.getElementById('cumples-lista');
  lista.innerHTML = '<p style="color:var(--text2);font-size:.85rem">Cargando...</p>';
  const cumples = await getCumpleanos();
  const hoy = new Date(); hoy.setHours(0,0,0,0);

  if (cumples.length === 0) {
    lista.innerHTML = '<p class="vacio-msg">No hay cumpleaños registrados.</p>';
    return;
  }

  lista.innerHTML = cumples.map(c => {
    const celeb = diaCelebracion(c.mes, c.dia);
    celeb.setHours(0,0,0,0);
    const esHoy = esMismoDia(celeb, hoy);
    const esPróximo = celeb > hoy && (celeb - hoy) < 7 * 24 * 60 * 60 * 1000;
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `
      <div class="cumple-row">
        <div class="cumple-info">
          <div class="cumple-row-nombre">🎂 ${c.nombre}</div>
          <div class="cumple-row-fecha">${c.dia} de ${meses[c.mes-1]} · Celebración: ${formatFecha(celeb)}</div>
        </div>
        ${esHoy ? '<span class="cumple-hoy">Hoy</span>' : ''}
        ${esPróximo && !esHoy ? '<span class="cumple-proximo">Esta semana</span>' : ''}
        <button class="btn-eliminar" data-id="${c.id}" title="Eliminar">🗑</button>
      </div>
    `;
  }).join('');

  lista.querySelectorAll('.btn-eliminar').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('¿Eliminar este cumpleaños?')) {
        await eliminarCumpleanos(btn.dataset.id);
        cargarCumplesAdmin();
      }
    });
  });
}

export function initFormCumple() {
  document.getElementById('btn-nuevo-cumple').addEventListener('click', () => {
    show(document.getElementById('form-cumple'));
  });
  document.getElementById('btn-cancelar-cumple').addEventListener('click', () => {
    hide(document.getElementById('form-cumple'));
  });
  document.getElementById('btn-guardar-cumple').addEventListener('click', async () => {
    const nombre = document.getElementById('cumple-nombre').value.trim();
    const fecha = document.getElementById('cumple-fecha').value;
    if (!nombre || !fecha) return alert('Completa nombre y fecha.');
    await agregarCumpleanos(nombre, fecha);
    document.getElementById('cumple-nombre').value = '';
    document.getElementById('cumple-fecha').value = '';
    hide(document.getElementById('form-cumple'));
    cargarCumplesAdmin();
  });
}

// ── USUARIOS ──
export async function cargarUsuariosAdmin() {
  const lista = document.getElementById('usuarios-lista');
  lista.innerHTML = '<p style="color:var(--text2);font-size:.85rem">Cargando...</p>';
  const snap = await getDocs(query(collection(db, 'usuarios'), orderBy('nombre')));
  const usuarios = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  if (usuarios.length === 0) {
    lista.innerHTML = '<p class="vacio-msg">No hay usuarios registrados.</p>';
    return;
  }

  lista.innerHTML = usuarios.map(u => `
    <div class="usuario-row">
      <div class="usuario-info">
        <div class="usuario-nombre">👤 ${u.nombre} ${u.rol === 'admin' ? '<span class="admin-badge">Admin</span>' : ''}</div>
        <div class="usuario-rut">${formatRut(u.rutClean)}</div>
      </div>
      <button class="btn-eliminar" data-id="${u.id}" title="Eliminar">🗑</button>
    </div>
  `).join('');

  lista.querySelectorAll('.btn-eliminar').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('¿Eliminar este usuario?')) {
        await deleteDoc(doc(db, 'usuarios', btn.dataset.id));
        cargarUsuariosAdmin();
      }
    });
  });
}

export function initFormUsuario() {
  document.getElementById('btn-nuevo-usuario').addEventListener('click', () => {
    show(document.getElementById('form-usuario'));
  });
  document.getElementById('btn-cancelar-usuario').addEventListener('click', () => {
    hide(document.getElementById('form-usuario'));
  });

  const rutInput = document.getElementById('usuario-rut');
  rutInput.addEventListener('input', () => {
    rutInput.value = formatRut(rutInput.value);
  });

  document.getElementById('btn-guardar-usuario').addEventListener('click', async () => {
    const nombre = document.getElementById('usuario-nombre').value.trim();
    const rutRaw = document.getElementById('usuario-rut').value.trim();
    const rutClean = cleanRut(rutRaw);
    if (!nombre || rutClean.length < 7) return alert('Completa nombre y RUT válido.');

    await addDoc(collection(db, 'usuarios'), { nombre, rutClean, rol: 'usuario' });
    document.getElementById('usuario-nombre').value = '';
    document.getElementById('usuario-rut').value = '';
    hide(document.getElementById('form-usuario'));
    cargarUsuariosAdmin();
  });
}

// ── MENÚ ──
export async function cargarMenuAdmin() {
  const lista = document.getElementById('menu-admin-lista');
  const header = document.getElementById('tab-menu').querySelector('.admin-panel-header');
  if (header) header.style.display = 'flex';

  lista.innerHTML = '<p style="color:var(--text2);font-size:.85rem">Cargando...</p>';

  let items = [];
  try {
    items = await getMenuLocalFlat('fuente-alemana');
  } catch(e) {
    lista.innerHTML = `<p class="vacio-msg">Error: ${e.message}</p>`;
    return;
  }

  if (items.length === 0) {
    lista.innerHTML = '<p class="vacio-msg">Sin ítems. Usa "Importar desde Justo" para cargar el menú.</p>';
    return;
  }

  lista.innerHTML = items.map(it => `
    <div class="menu-admin-item">
      <div class="menu-admin-info">
        <div class="menu-admin-nombre">${it.emoji || '🍽️'} ${it.nombre}</div>
        <div class="menu-admin-cat">${it.categoria}</div>
      </div>
      <span class="menu-admin-precio">${formatPrecio(it.precio)}</span>
      <button class="btn-eliminar" data-id="${it.id}">🗑</button>
    </div>
  `).join('');

  lista.querySelectorAll('.btn-eliminar').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('¿Eliminar este ítem?')) {
        await eliminarMenuItem(btn.dataset.id);
        cargarMenuAdmin();
      }
    });
  });
}

export function initImportarMenu() {
  document.addEventListener('click', async (e) => {
    if (e.target && e.target.id === 'btn-importar-menu') {
      const status = document.getElementById('import-status');
      show(status);
      status.textContent = 'Importando menú...';
      e.target.disabled = true;
      try {
        await importarMenu('fuente-alemana', MENU_FUENTE_ALEMANA);
        status.textContent = `✓ ${MENU_FUENTE_ALEMANA.length} ítems importados correctamente.`;
        cargarMenuAdmin();
      } catch (err) {
        status.textContent = '✗ Error: ' + err.message;
      }
      e.target.disabled = false;
    }
  });
}

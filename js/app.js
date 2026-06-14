import { loginConRut, getUsuarioActual, setUsuarioActual, guardarSesion, cargarSesion, cerrarSesion, initRutInput } from './auth.js';
import { getCumpleanos, diaCelebracion, esMismoDia } from './cumples.js';
import { getLocales, getMenuLocal, MENU_FUENTE_ALEMANA, getMenuLocalFlat, importarMenu } from './menu.js';
import { getCarrito, agregarAlCarrito, eliminarDelCarrito, getTotalCarrito, getCountCarrito, limpiarCarrito, confirmarPedido, getPedidosUsuario } from './pedidos.js';
import { formatPrecio, formatFecha, show, hide } from './utils.js';
import { initAdminTabs, cargarTabActivo, initFormCumple, initFormUsuario, initImportarMenu } from './admin.js';

let menuActual = {}, localActual = null, itemSeleccionado = null, qty = 1;
let todosPedidos = [];

document.addEventListener('DOMContentLoaded', async () => {
  initRutInput();
  document.getElementById('btn-login').addEventListener('click', handleLogin);
  const sesion = cargarSesion();
  if (sesion) { setUsuarioActual(sesion); sesion.rol==='admin' ? mostrarAdmin() : await mostrarApp(); }
});

async function handleLogin() {
  const rut = document.getElementById('rut-input').value;
  const errorEl = document.getElementById('login-error');
  hide(errorEl);
  if (!rut || rut.length < 5) { show(errorEl); errorEl.textContent='Ingresa un RUT válido.'; return; }
  const btn = document.getElementById('btn-login');
  btn.textContent='Verificando...'; btn.disabled=true;
  try {
    const usuario = await loginConRut(rut);
    if (!usuario) { show(errorEl); errorEl.textContent='RUT no encontrado. Contacta al admin.'; }
    else { setUsuarioActual(usuario); guardarSesion(usuario); usuario.rol==='admin' ? mostrarAdmin() : await mostrarApp(); }
  } catch(e) { show(errorEl); errorEl.textContent='Error de conexión.'; }
  btn.textContent='Entrar'; btn.disabled=false;
}

async function mostrarApp() {
  hide(document.getElementById('screen-login'));
  show(document.getElementById('screen-app'));
  const usuario = getUsuarioActual();
  document.getElementById('header-username').textContent = usuario.nombre;
  document.getElementById('btn-logout').onclick = () => { cerrarSesion(); location.reload(); };
  await renderHome();
}

// ── HOME ──
async function renderHome() {
  const usuario = getUsuarioActual();
  show(document.getElementById('section-home'));
  hide(document.getElementById('section-locales'));
  hide(document.getElementById('section-menu'));
  hide(document.getElementById('carrito-fab'));

  // Próximo cumpleaños dentro de 7 días
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const en7 = new Date(hoy); en7.setDate(en7.getDate()+7);
  const cumples = await getCumpleanos();
  let proxCumple = null, fechaCeleb = null;

  for (const c of cumples) {
    const celeb = diaCelebracion(c.mes, c.dia); celeb.setHours(0,0,0,0);
    if (celeb >= hoy && celeb <= en7) {
      if (!fechaCeleb || celeb < fechaCeleb) { proxCumple = c; fechaCeleb = celeb; }
    }
  }

  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const diasSem = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const cumpleCard = document.getElementById('cumple-card');
  const cumpleInfo = document.getElementById('cumple-info');
  const btnPedir = document.getElementById('btn-ir-a-pedir');
  const sigCumple = document.getElementById('siguiente-cumple');

  if (proxCumple) {
    const esHoy = esMismoDia(fechaCeleb, hoy);
    const diasRestantes = Math.round((fechaCeleb - hoy)/(1000*60*60*24));
    cumpleCard.className = 'cumple-card ' + (esHoy ? 'cumple-hoy-card' : 'cumple-pronto-card');
    cumpleInfo.innerHTML = esHoy
      ? `<span class="cumple-tag hoy">🎉 ¡Hoy!</span><div class="cumple-nombre">${proxCumple.nombre} está de cumpleaños</div><div class="cumple-sub">El pedido está habilitado</div>`
      : `<span class="cumple-tag pronto">📅 En ${diasRestantes} día${diasRestantes>1?'s':''}</span><div class="cumple-nombre">${proxCumple.nombre}</div><div class="cumple-sub">Celebramos el ${diasSem[fechaCeleb.getDay()]} ${fechaCeleb.getDate()} de ${meses[fechaCeleb.getMonth()]}</div>`;
    show(btnPedir);
    hide(sigCumple);
    btnPedir.onclick = mostrarLocales;
  } else {
    cumpleCard.className = 'cumple-card cumple-sin-card';
    cumpleInfo.innerHTML = `<span class="cumple-tag sin">🔒 Sin pedidos</span><div class="cumple-nombre">No hay cumpleaños esta semana</div>`;
    hide(btnPedir);
    // Mostrar el siguiente aunque esté lejos
    const futuros = [];
    for (const c of cumples) {
      const celeb = diaCelebracion(c.mes, c.dia); celeb.setHours(0,0,0,0);
      if (celeb > en7) futuros.push({...c, celeb});
    }
    futuros.sort((a,b) => a.celeb-b.celeb);
    if (futuros.length > 0) {
      sigCumple.textContent = `Próximo: ${futuros[0].nombre} — ${formatFecha(futuros[0].celeb)}`;
      show(sigCumple);
    }
  }

  // Pedidos del usuario
  todosPedidos = await getPedidosUsuario(usuario.id);
  const pendientes = todosPedidos.filter(p => p.estado==='pendiente');
  const pagados = todosPedidos.filter(p => p.estado!=='pendiente');

  // Pendiente
  const secPend = document.getElementById('section-pendiente');
  if (pendientes.length > 0) {
    show(secPend);
    const p = pendientes[0];
    document.getElementById('pend-total').textContent = formatPrecio(p.total);
    document.getElementById('pend-local').textContent = p.localNombre;
    const fecha = p.fecha?.toDate ? p.fecha.toDate() : new Date(p.fecha);
    document.getElementById('pend-fecha').textContent = formatFecha(fecha);
    document.getElementById('btn-ver-pendiente').onclick = () => abrirDetalle(p);
  } else hide(secPend);

  // Historial
  const secHist = document.getElementById('section-historial');
  const listaHist = document.getElementById('historial-lista');
  if (pagados.length > 0) {
    show(secHist);
    listaHist.innerHTML = pagados.slice(0,8).map(p => {
      const fecha = p.fecha?.toDate ? p.fecha.toDate() : new Date(p.fecha);
      return `<div class="hist-row" data-id="${p.id}">
        <div class="hist-info"><span class="hist-local">${p.localNombre}</span><span class="hist-fecha">${formatFecha(fecha)}</span></div>
        <span class="hist-monto">${formatPrecio(p.total)}</span>
        <span class="hist-arrow">›</span>
      </div>`;
    }).join('');
    listaHist.querySelectorAll('.hist-row').forEach(row => {
      row.addEventListener('click', () => {
        const p = todosPedidos.find(x => x.id===row.dataset.id);
        if (p) abrirDetalle(p);
      });
    });
  } else hide(secHist);
}

// ── LOCALES ──
async function mostrarLocales() {
  hide(document.getElementById('section-home'));
  show(document.getElementById('section-locales'));
  const lista = document.getElementById('lista-locales');
  lista.innerHTML = '<p class="loading-txt">Cargando...</p>';
  let locales = await getLocales();
  if (!locales.length) locales = [{id:'fuente-alemana',nombre:'Fuente Alemana',descripcion:'Concepción · Completos y sándwiches',emoji:'🌭'}];
  lista.innerHTML = locales.map(l => `
    <div class="local-card" data-id="${l.id}" data-nombre="${l.nombre}">
      <span class="local-emoji">${l.emoji||'🍽️'}</span>
      <div class="local-info"><div class="local-nombre">${l.nombre}</div><div class="local-desc">${l.descripcion||''}</div></div>
      <span class="local-arr">›</span>
    </div>`).join('');
  lista.querySelectorAll('.local-card').forEach(c => c.addEventListener('click', () => mostrarMenu(c.dataset.id, c.dataset.nombre)));
  document.getElementById('btn-volver-home').onclick = () => { hide(document.getElementById('section-locales')); show(document.getElementById('section-home')); };
}

// ── MENÚ ──
async function mostrarMenu(localId, localNombre) {
  localActual = {id:localId, nombre:localNombre};
  limpiarCarrito(); actualizarFAB();
  hide(document.getElementById('section-locales'));
  show(document.getElementById('section-menu'));
  document.getElementById('menu-titulo').textContent = localNombre;
  const catEl = document.getElementById('menu-cats');
  const itemsEl = document.getElementById('menu-items');
  catEl.innerHTML = '<span class="loading-txt">Cargando...</span>'; itemsEl.innerHTML='';
  let grupos = await getMenuLocal(localId);
  if (!Object.keys(grupos).length) { await importarMenu(localId, MENU_FUENTE_ALEMANA); grupos = await getMenuLocal(localId); }
  menuActual = grupos;
  const cats = Object.keys(grupos);
  let catActiva = cats[0];
  catEl.innerHTML = cats.map(c => `<button class="cat-pill${c===catActiva?' active':''}" data-cat="${c}">${c}</button>`).join('');
  catEl.querySelectorAll('.cat-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      catEl.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active'); catActiva=btn.dataset.cat; renderItems(grupos[catActiva]);
    });
  });
  renderItems(grupos[catActiva]);
  document.getElementById('btn-volver-locales').onclick = () => { hide(document.getElementById('section-menu')); show(document.getElementById('section-locales')); limpiarCarrito(); actualizarFAB(); };
}

function renderItems(items) {
  const el = document.getElementById('menu-items');
  el.innerHTML = items.map(item => `
    <div class="item-card" data-id="${item.id}">
      <div class="item-emoji">${item.emoji||'🍽️'}</div>
      <div class="item-body">
        <div class="item-nombre">${item.nombre}</div>
        ${item.descripcion?`<div class="item-desc">${item.descripcion}</div>`:''}
      </div>
      <div class="item-precio">${formatPrecio(item.precio)}</div>
    </div>`).join('');
  el.querySelectorAll('.item-card').forEach(card => {
    card.addEventListener('click', () => {
      const item = Object.values(menuActual).flat().find(i => i.id===card.dataset.id);
      if (item) abrirModalItem(item);
    });
  });
}

// ── MODAL ÍTEM ──
function abrirModalItem(item) {
  itemSeleccionado=item; qty=1;
  document.getElementById('mi-emoji').textContent = item.emoji||'🍽️';
  document.getElementById('mi-nombre').textContent = item.nombre;
  document.getElementById('mi-desc').textContent = item.descripcion||'';
  document.getElementById('mi-precio').textContent = formatPrecio(item.precio);
  document.getElementById('mi-comentario').value='';
  document.getElementById('mi-qty').textContent='1';
  show(document.getElementById('modal-item'));
}
document.getElementById('btn-cerrar-item').onclick = () => hide(document.getElementById('modal-item'));
document.getElementById('modal-item').addEventListener('click', e => { if(e.target===document.getElementById('modal-item')) hide(document.getElementById('modal-item')); });
document.getElementById('btn-qty-menos').onclick = () => { qty=Math.max(1,qty-1); document.getElementById('mi-qty').textContent=qty; };
document.getElementById('btn-qty-mas').onclick = () => { qty=Math.min(10,qty+1); document.getElementById('mi-qty').textContent=qty; };
document.getElementById('btn-agregar-item').onclick = () => {
  if(!itemSeleccionado) return;
  agregarAlCarrito(itemSeleccionado, qty, document.getElementById('mi-comentario').value.trim());
  hide(document.getElementById('modal-item')); actualizarFAB();
};

// ── FAB ──
function actualizarFAB() {
  const count=getCountCarrito();
  const fab=document.getElementById('carrito-fab');
  const menuVisible=document.getElementById('section-menu').style.display!=='none';
  if(count>0 && menuVisible){ show(fab); document.getElementById('fab-count').textContent=count; document.getElementById('fab-total').textContent=formatPrecio(getTotalCarrito()); }
  else hide(fab);
}
document.getElementById('carrito-fab').onclick = () => { renderCarrito(); show(document.getElementById('modal-carrito')); };

// ── MODAL CARRITO ──
function renderCarrito() {
  const lista=document.getElementById('carrito-lista');
  const c=getCarrito();
  lista.innerHTML = c.length===0 ? '<p class="loading-txt">El carrito está vacío</p>' :
    c.map((x,i)=>`<div class="carrito-item">
      <span class="ci-emoji">${x.emoji}</span>
      <div class="ci-info"><div class="ci-nombre">${x.nombre} <span class="ci-qty">×${x.cantidad}</span></div>${x.comentario?`<div class="ci-comentario">💬 ${x.comentario}</div>`:''}</div>
      <span class="ci-precio">${formatPrecio(x.precio*x.cantidad)}</span>
      <button class="ci-del" data-i="${i}">✕</button>
    </div>`).join('');
  lista.querySelectorAll('.ci-del').forEach(btn => { btn.onclick=()=>{ eliminarDelCarrito(parseInt(btn.dataset.i)); renderCarrito(); actualizarFAB(); }; });
  document.getElementById('carrito-total').textContent = formatPrecio(getTotalCarrito());
}
document.getElementById('btn-cerrar-carrito').onclick = () => hide(document.getElementById('modal-carrito'));
document.getElementById('modal-carrito').addEventListener('click', e => { if(e.target===document.getElementById('modal-carrito')) hide(document.getElementById('modal-carrito')); });
document.getElementById('btn-confirmar-pedido').onclick = async () => {
  const usuario=getUsuarioActual();
  if(!getCarrito().length) return;
  const btn=document.getElementById('btn-confirmar-pedido');
  btn.textContent='Confirmando...'; btn.disabled=true;
  try {
    await confirmarPedido(usuario.id, usuario.nombre, localActual.id, localActual.nombre);
    hide(document.getElementById('modal-carrito')); actualizarFAB();
    hide(document.getElementById('section-menu'));
    await renderHome(); show(document.getElementById('section-home'));
    alert('✓ ¡Pedido confirmado! 🎉');
  } catch(e) { alert('Error: '+e.message); }
  btn.textContent='Confirmar pedido'; btn.disabled=false;
};

// ── MODAL DETALLE ──
function abrirDetalle(pedido) {
  const fecha = pedido.fecha?.toDate ? pedido.fecha.toDate() : new Date(pedido.fecha);
  document.getElementById('det-titulo').textContent = pedido.localNombre;
  document.getElementById('det-fecha').textContent = formatFecha(fecha);
  document.getElementById('det-lista').innerHTML = pedido.items.map(i=>`
    <div class="det-item">
      <span>${i.emoji} ${i.nombre} ×${i.cantidad}${i.comentario?` <em>(${i.comentario})</em>`:''}</span>
      <span>${formatPrecio(i.precio*i.cantidad)}</span>
    </div>`).join('');
  document.getElementById('det-total').textContent = formatPrecio(pedido.total);
  show(document.getElementById('modal-detalle'));
}
document.getElementById('btn-cerrar-detalle').onclick = () => hide(document.getElementById('modal-detalle'));
document.getElementById('modal-detalle').addEventListener('click', e => { if(e.target===document.getElementById('modal-detalle')) hide(document.getElementById('modal-detalle')); });

// ── ADMIN ──
function mostrarAdmin() {
  hide(document.getElementById('screen-login'));
  show(document.getElementById('screen-admin'));
  initAdminTabs(); initFormCumple(); initFormUsuario(); initImportarMenu();
  cargarTabActivo('pedidos');
  document.getElementById('btn-admin-logout').onclick = () => { cerrarSesion(); location.reload(); };
}

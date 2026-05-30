import { db } from './firebase.js';
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Estado del carrito (en memoria)
let carrito = [];

export function getCarrito() { return carrito; }
export function limpiarCarrito() { carrito = []; }

export function agregarAlCarrito(item, cantidad, comentario) {
  const existe = carrito.findIndex(c => c.itemId === item.id && c.comentario === comentario);
  if (existe >= 0) {
    carrito[existe].cantidad += cantidad;
  } else {
    carrito.push({
      itemId: item.id,
      nombre: item.nombre,
      precio: item.precio,
      emoji: item.emoji || '🍽️',
      cantidad,
      comentario: comentario || '',
    });
  }
}

export function eliminarDelCarrito(index) {
  carrito.splice(index, 1);
}

export function getTotalCarrito() {
  return carrito.reduce((acc, c) => acc + c.precio * c.cantidad, 0);
}

export function getCountCarrito() {
  return carrito.reduce((acc, c) => acc + c.cantidad, 0);
}

// Guarda el pedido en Firestore
export async function confirmarPedido(usuarioId, nombreUsuario, localId, localNombre) {
  if (carrito.length === 0) return null;

  const pedido = {
    usuarioId,
    nombreUsuario,
    localId,
    localNombre,
    items: [...carrito],
    total: getTotalCarrito(),
    fecha: Timestamp.now(),
    estado: 'pendiente',
  };

  const ref = await addDoc(collection(db, 'pedidos'), pedido);
  limpiarCarrito();
  return ref.id;
}

// Retorna pedidos del usuario actual
export async function getPedidosUsuario(usuarioId) {
  const q = query(
    collection(db, 'pedidos'),
    where('usuarioId', '==', usuarioId),
    orderBy('fecha', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Retorna TODOS los pedidos de hoy (para admin)
export async function getPedidosHoy() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);

  const q = query(
    collection(db, 'pedidos'),
    where('fecha', '>=', Timestamp.fromDate(hoy)),
    where('fecha', '<', Timestamp.fromDate(manana)),
    orderBy('fecha', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

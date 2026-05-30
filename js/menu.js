import { db } from './firebase.js';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, orderBy, writeBatch }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Retorna todos los locales activos
export async function getLocales() {
  const snap = await getDocs(collection(db, 'locales'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Retorna ítems del menú de un local, agrupados por categoría
export async function getMenuLocal(localId) {
  const q = query(
    collection(db, 'menu_items'),
    where('localId', '==', localId),
    orderBy('categoria'),
    orderBy('nombre')
  );
  const snap = await getDocs(q);
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Agrupar por categoría
  const grupos = {};
  for (const item of items) {
    if (!grupos[item.categoria]) grupos[item.categoria] = [];
    grupos[item.categoria].push(item);
  }
  return grupos;
}

// Retorna todos los ítems del menú de un local (sin agrupar)
export async function getMenuLocalFlat(localId) {
  const q = query(collection(db, 'menu_items'), where('localId', '==', localId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Importa ítems al menú (reemplaza los del local)
export async function importarMenu(localId, items) {
  // Borra los existentes
  const existentes = await getMenuLocalFlat(localId);
  const batch = writeBatch(db);
  for (const item of existentes) {
    batch.delete(doc(db, 'menu_items', item.id));
  }
  await batch.commit();

  // Agrega los nuevos
  for (const item of items) {
    await addDoc(collection(db, 'menu_items'), { ...item, localId });
  }
}

// Elimina ítem del menú
export async function eliminarMenuItem(id) {
  await deleteDoc(doc(db, 'menu_items', id));
}

// Menú de Fuente Alemana precargado (respaldo si no hay datos en Firestore)
// Se puede reemplazar via importación desde el panel admin
export const MENU_FUENTE_ALEMANA = [
  { categoria: 'Completos', nombre: 'Completo Italiano', descripcion: 'Con tomate, palta y mayonesa', precio: 3200, emoji: '🌭' },
  { categoria: 'Completos', nombre: 'Completo Dinámico', descripcion: 'Con chucrut, tomate y mayonesa', precio: 3000, emoji: '🌭' },
  { categoria: 'Completos', nombre: 'Completo Americano', descripcion: 'Con ketchup y mostaza', precio: 2800, emoji: '🌭' },
  { categoria: 'Sándwiches', nombre: 'Lomito Clásico', descripcion: 'Lomo de cerdo, tomate, palta, mayonesa', precio: 4500, emoji: '🥪' },
  { categoria: 'Sándwiches', nombre: 'Barros Luco', descripcion: 'Carne y queso derretido', precio: 4200, emoji: '🥪' },
  { categoria: 'Sándwiches', nombre: 'Chacarero', descripcion: 'Carne, porotos verdes, tomate, ají', precio: 4000, emoji: '🥪' },
  { categoria: 'Sándwiches', nombre: 'Ave Palta', descripcion: 'Pechuga de pollo y palta', precio: 4200, emoji: '🥪' },
  { categoria: 'Bebidas', nombre: 'Bebida 350ml', descripcion: 'Coca-Cola, Sprite o Fanta', precio: 1200, emoji: '🥤' },
  { categoria: 'Bebidas', nombre: 'Agua mineral', descripcion: 'Botella 500ml', precio: 900, emoji: '💧' },
  { categoria: 'Papas', nombre: 'Papas fritas', descripcion: 'Porción individual', precio: 2000, emoji: '🍟' },
  { categoria: 'Papas', nombre: 'Papas con queso', descripcion: 'Porción con queso fundido', precio: 2500, emoji: '🍟' },
];

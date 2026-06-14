import { db } from './firebase.js';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, orderBy, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
export async function getLocales() { const snap=await getDocs(collection(db,'locales')); return snap.docs.map(d=>({id:d.id,...d.data()})); }
export async function getMenuLocal(localId) {
  const q=query(collection(db,'menu_items'),where('localId','==',localId),orderBy('categoria'),orderBy('nombre'));
  const snap=await getDocs(q);
  const items=snap.docs.map(d=>({id:d.id,...d.data()}));
  const grupos={};
  for(const item of items){ if(!grupos[item.categoria]) grupos[item.categoria]=[]; grupos[item.categoria].push(item); }
  return grupos;
}
export async function getMenuLocalFlat(localId) { const q=query(collection(db,'menu_items'),where('localId','==',localId)); const snap=await getDocs(q); return snap.docs.map(d=>({id:d.id,...d.data()})); }
export async function importarMenu(localId,items) {
  const existentes=await getMenuLocalFlat(localId);
  const batch=writeBatch(db);
  for(const item of existentes) batch.delete(doc(db,'menu_items',item.id));
  await batch.commit();
  for(const item of items) await addDoc(collection(db,'menu_items'),{...item,localId});
}
export async function eliminarMenuItem(id) { await deleteDoc(doc(db,'menu_items',id)); }
export const MENU_FUENTE_ALEMANA = [
  { categoria:'Lomo Ahumado', nombre:'Lomo Ahumado Completo', descripcion:'Con mayonesa casera, tomate y chukrut', precio:5500, emoji:'🥪' },
  { categoria:'Lomo Ahumado', nombre:'Lomo Ahumado Diplomático', descripcion:'Con queso fundido y huevo revuelto', precio:5950, emoji:'🥪' },
  { categoria:'Lomo Ahumado', nombre:'Lomo Ahumado Especial', descripcion:'Con mayonesa casera', precio:4900, emoji:'🥪' },
  { categoria:'Lomo Ahumado', nombre:'Lomo Ahumado Italiano', descripcion:'Con mayonesa casera, tomate y palta', precio:6150, emoji:'🥪' },
  { categoria:'Lomo Ahumado', nombre:'Lomo Ahumado Luco', descripcion:'Con queso fundido', precio:5650, emoji:'🥪' },
  { categoria:'Lomo Ahumado', nombre:'Lomo Ahumado Patrón', descripcion:'Con queso fundido, tomate, choclo y mayonesa', precio:6250, emoji:'🥪' },
  { categoria:'Lomo Ahumado', nombre:'Lomo Ahumado Pobre', descripcion:'Con queso fundido, huevo revuelto y cebolla frita', precio:5950, emoji:'🥪' },
  { categoria:'Lomo Ahumado', nombre:'Lomo Ahumado Solo', descripcion:'Lomo ahumado artesanal a la plancha', precio:4600, emoji:'🥪' },
  { categoria:'Churrascos', nombre:'Churrasco Diplomático', descripcion:'Con queso fundido y huevo', precio:5700, emoji:'🥩' },
  { categoria:'Churrascos', nombre:'Churrasco Pobre', descripcion:'Con queso fundido, cebolla frita y huevo', precio:5700, emoji:'🥩' },
  { categoria:'Churrascos', nombre:'Chacarero', descripcion:'Con tomate y poroto verde', precio:5700, emoji:'🥩' },
  { categoria:'Churrascos', nombre:'Barros Luco Patrón', descripcion:'Con queso fundido, tomate, choclo y mayonesa', precio:5950, emoji:'🥩' },
  { categoria:'Churrascos', nombre:'Barros Jarpa', descripcion:'Jamón a la plancha y queso fundido', precio:4600, emoji:'🥩' },
  { categoria:'Churrascos', nombre:'Barros Jarpa Patrón', descripcion:'Con jamón, queso fundido, tomate, choclo y mayonesa', precio:5950, emoji:'🥩' },
  { categoria:'Churrascos', nombre:'Barros Luco', descripcion:'Con queso fundido', precio:5400, emoji:'🥩' },
  { categoria:'Churrascos', nombre:'Churrasco Italiano', descripcion:'Con tomate, palta y mayonesa', precio:5900, emoji:'🥩' },
  { categoria:'Churrascos', nombre:'Churrasco Solo', descripcion:'Churrasco a la plancha', precio:4350, emoji:'🥩' },
  { categoria:'Lomitos', nombre:'Lomo Completo', descripcion:'Con tomate, mayonesa y chut rut', precio:5250, emoji:'🌮' },
  { categoria:'Lomitos', nombre:'Lomo Pobre', descripcion:'Con queso fundido, cebolla frita y huevo', precio:5700, emoji:'🌮' },
  { categoria:'Lomitos', nombre:'Lomo Italiano', descripcion:'Con tomate, palta y mayonesa', precio:5900, emoji:'🌮' },
  { categoria:'Lomitos', nombre:'Lomo Diplomático', descripcion:'Con queso fundido y huevo', precio:5700, emoji:'🌮' },
  { categoria:'Lomitos', nombre:'Lomo Luco', descripcion:'Con queso fundido', precio:5400, emoji:'🌮' },
  { categoria:'Gordas', nombre:'Gorda Completa', descripcion:'Con tomate, mayonesa y chut rut', precio:4700, emoji:'🌭' },
  { categoria:'Gordas', nombre:'Gorda Italiana', descripcion:'Con tomate, mayonesa y palta', precio:5500, emoji:'🌭' },
  { categoria:'Gordas', nombre:'Gorda Luco', descripcion:'Con queso fundido', precio:5400, emoji:'🌭' },
  { categoria:'Bebidas', nombre:'Coca Cola 350cc', descripcion:'', precio:1900, emoji:'🥤' },
  { categoria:'Bebidas', nombre:'Coca Cola Light 350cc', descripcion:'', precio:1900, emoji:'🥤' },
  { categoria:'Bebidas', nombre:'Sprite 350cc', descripcion:'', precio:1900, emoji:'🥤' },
  { categoria:'Bebidas', nombre:'Fanta 350cc', descripcion:'', precio:1900, emoji:'🥤' },
  { categoria:'Bebidas', nombre:'Agua mineral con gas', descripcion:'', precio:2050, emoji:'💧' },
  { categoria:'Bebidas', nombre:'Agua mineral sin gas', descripcion:'', precio:2050, emoji:'💧' },
];

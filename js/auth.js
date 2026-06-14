import { db } from './firebase.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { formatRut, cleanRut } from './utils.js';
let usuarioActual = null;
export function getUsuarioActual() { return usuarioActual; }
export function setUsuarioActual(u) { usuarioActual = u; }
export function initRutInput() {
  const input = document.getElementById('rut-input');
  input.addEventListener('input', () => { input.value = formatRut(input.value); });
  input.addEventListener('keydown', e => { if (e.key==='Enter') document.getElementById('btn-login').click(); });
}
export async function loginConRut(rutRaw) {
  const rut = cleanRut(rutRaw);
  if (rut.length < 7) return null;
  const q = query(collection(db,'usuarios'), where('rutClean','==',rut));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() };
}
export function guardarSesion(u) { sessionStorage.setItem('usuario', JSON.stringify(u)); }
export function cargarSesion() { const r=sessionStorage.getItem('usuario'); try{return r?JSON.parse(r):null;}catch{return null;} }
export function cerrarSesion() { sessionStorage.removeItem('usuario'); usuarioActual=null; }

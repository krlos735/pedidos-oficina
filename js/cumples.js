import { db } from './firebase.js';
import { collection, getDocs, addDoc, deleteDoc, doc, orderBy, query } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { diaCelebracion, esMismoDia } from './utils.js';
export { diaCelebracion, esMismoDia };
export async function getCumpleanos() {
  const snap = await getDocs(query(collection(db,'cumpleanos'), orderBy('mes'), orderBy('dia')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function agregarCumpleanos(nombre, fecha) {
  const [,mesStr,diaStr] = fecha.split('-');
  await addDoc(collection(db,'cumpleanos'), { nombre, mes: parseInt(mesStr), dia: parseInt(diaStr) });
}
export async function eliminarCumpleanos(id) { await deleteDoc(doc(db,'cumpleanos',id)); }
export async function verificarCumpleHoy() {
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const cumples = await getCumpleanos();
  for (const c of cumples) {
    const d = diaCelebracion(c.mes, c.dia); d.setHours(0,0,0,0);
    if (esMismoDia(d, hoy)) return { activo: true, nombre: c.nombre };
  }
  return { activo: false };
}
export async function getProximoCumple() {
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const cumples = await getCumpleanos();
  let proximo = null, proximaFecha = null;
  for (const c of cumples) {
    const d = diaCelebracion(c.mes, c.dia); d.setHours(0,0,0,0);
    if (d >= hoy && (!proximaFecha || d < proximaFecha)) { proximaFecha = d; proximo = { ...c, fechaCelebracion: d }; }
  }
  return proximo;
}

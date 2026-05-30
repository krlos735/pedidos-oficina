import { db } from './firebase.js';
import { collection, getDocs, addDoc, deleteDoc, doc, orderBy, query }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { diaCelebracion, esMismoDia } from './utils.js';

export { diaCelebracion, esMismoDia };

// Retorna todos los cumpleaños de Firestore
export async function getCumpleanos() {
  const snap = await getDocs(query(collection(db, 'cumpleanos'), orderBy('mes'), orderBy('dia')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Agrega un cumpleaños
export async function agregarCumpleanos(nombre, fecha) {
  // fecha es string "YYYY-MM-DD"
  const [, mesStr, diaStr] = fecha.split('-');
  const mes = parseInt(mesStr, 10);
  const dia = parseInt(diaStr, 10);
  await addDoc(collection(db, 'cumpleanos'), { nombre, mes, dia });
}

// Elimina un cumpleaños
export async function eliminarCumpleanos(id) {
  await deleteDoc(doc(db, 'cumpleanos', id));
}

// Verifica si HOY hay un cumpleaños activo (día hábil de celebración = hoy)
// Retorna { activo: bool, nombre: string, fechaOriginal: Date } 
export async function verificarCumpleHoy() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const cumples = await getCumpleanos();

  for (const c of cumples) {
    const diaCeleb = diaCelebracion(c.mes, c.dia);
    diaCeleb.setHours(0, 0, 0, 0);
    if (esMismoDia(diaCeleb, hoy)) {
      return { activo: true, nombre: c.nombre };
    }
  }
  return { activo: false };
}

// Retorna el próximo cumpleaños con su fecha de celebración
export async function getProximoCumple() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const cumples = await getCumpleanos();
  let proximo = null;
  let proximaFecha = null;

  for (const c of cumples) {
    const diaCeleb = diaCelebracion(c.mes, c.dia);
    diaCeleb.setHours(0, 0, 0, 0);
    if (diaCeleb >= hoy) {
      if (!proximaFecha || diaCeleb < proximaFecha) {
        proximaFecha = diaCeleb;
        proximo = { ...c, fechaCelebracion: diaCeleb };
      }
    }
  }
  return proximo;
}

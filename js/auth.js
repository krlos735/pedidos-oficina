import { db } from './firebase.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { formatRut, cleanRut } from './utils.js';

let usuarioActual = null;

export function getUsuarioActual() { return usuarioActual; }
export function setUsuarioActual(u) { usuarioActual = u; }

// Formatea el input de RUT mientras el usuario escribe
export function initRutInput() {
  const input = document.getElementById('rut-input');
  input.addEventListener('input', () => {
    const pos = input.selectionStart;
    const formatted = formatRut(input.value);
    input.value = formatted;
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('btn-login').click();
  });
}

// Valida RUT contra Firestore y retorna el usuario o null
export async function loginConRut(rutRaw) {
  const rut = cleanRut(rutRaw);
  if (rut.length < 7) return null;

  const q = query(collection(db, 'usuarios'), where('rutClean', '==', rut));
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() };
}

// Persiste sesión en sessionStorage
export function guardarSesion(usuario) {
  sessionStorage.setItem('usuario', JSON.stringify(usuario));
}

export function cargarSesion() {
  const raw = sessionStorage.getItem('usuario');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function cerrarSesion() {
  sessionStorage.removeItem('usuario');
  usuarioActual = null;
}

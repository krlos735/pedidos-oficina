export function formatRut(rut) {
  const clean = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length < 2) return clean;
  const dv = clean.slice(-1);
  const num = clean.slice(0, -1);
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv;
}
export function cleanRut(rut) { return rut.replace(/[^0-9kK]/g, '').toUpperCase(); }
export function formatPrecio(n) { return '$' + Math.round(n).toLocaleString('es-CL'); }
export function formatFecha(date) { return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
export function show(el) { el.classList.remove('hidden'); el.style.display = ''; }
export function hide(el) { el.classList.add('hidden'); el.style.display = 'none'; }
export const FERIADOS = new Set([
  '2025-01-01','2025-04-18','2025-04-19','2025-05-01','2025-05-21','2025-06-20','2025-06-29',
  '2025-07-16','2025-08-15','2025-09-18','2025-09-19','2025-10-12','2025-10-31','2025-11-01',
  '2025-12-08','2025-12-25','2026-01-01','2026-04-03','2026-04-04','2026-05-01','2026-05-21',
  '2026-06-19','2026-06-29','2026-07-16','2026-08-15','2026-09-18','2026-09-19','2026-10-12',
  '2026-10-31','2026-11-01','2026-12-08','2026-12-25',
]);
export function proximoDiaHabil(date) {
  const d = new Date(date);
  while (true) {
    const dow = d.getDay();
    const iso = d.toISOString().slice(0,10);
    if (dow !== 0 && dow !== 6 && !FERIADOS.has(iso)) return d;
    d.setDate(d.getDate() + 1);
  }
}
export function diaCelebracion(mes, dia) {
  const hoy = new Date();
  let year = hoy.getFullYear();
  let f = new Date(year, mes-1, dia);
  const hoyClean = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  if (f < hoyClean) { year += 1; f = new Date(year, mes-1, dia); }
  return proximoDiaHabil(f);
}
export function esMismoDia(a, b) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}

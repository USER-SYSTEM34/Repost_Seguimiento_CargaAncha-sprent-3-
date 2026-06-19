import { createClient, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { PetroMapiData, ensureAdminAccs } from './db';
import { Personal, Vehiculo, Monitoreo, Incidencia } from './types';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://somijzibukbgoedflina.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_U3RL96IImYu6t9POkf1nsQ_cZy1jJoE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

// ── ROL MAPPING ──
const ROL_MAP: Record<string, string> = {
  admin: 'Administradores (Full Acceso)',
  supervisor: 'Supervisor de Control',
  operador: 'Conductor de Ruta (Chofer de unidad)',
};
const ROL_REVERSE: Record<string, string> = {
  'Administradores (Full Acceso)': 'admin',
  'Supervisor de Control': 'supervisor',
  'Conductor de Ruta (Chofer de unidad)': 'operador',
};

const ESTADO_VEHICULO_MAP: Record<string, Vehiculo['estado_mantenimiento']> = {
  activo: 'Operativo',
  mantenimiento: 'En Taller',
};
const ESTADO_VEHICULO_REVERSE: Record<string, string> = {
  Operativo: 'activo',
  'En Taller': 'mantenimiento',
  'Falla Mecánica': 'mantenimiento',
};

const ESTADO_MONITOREO_MAP: Record<string, Monitoreo['estado']> = {
  'en transito': 'En Ruta',
  finalizado: 'Completado',
  programado: 'En Ruta',
};
const ESTADO_MONITOREO_REVERSE: Record<string, string> = {
  'En Ruta': 'en transito',
  Completado: 'finalizado',
  Incidencia: 'en transito',
};

// ── CONVERTERS: SQL row → App type ──

function toPersonal(u: any): Personal {
  return {
    id_personal: u.id_usuario,
    nombre_completo: u.nombre || '',
    usuario: u.email,
    correo: u.email,
    contrasena: u.password_hash || '',
    rol: ROL_MAP[u.rol] || u.rol || 'operador',
    estado: u.activo === true || u.activo === 1 ? 1 : 0,
  };
}

function fromPersonal(p: Personal): any {
  return {
    id_usuario: p.id_personal,
    email: p.usuario,
    nombre: p.nombre_completo,
    password_hash: p.contrasena,
    rol: ROL_REVERSE[p.rol] || p.rol || 'operador',
    activo: p.estado === 1,
  };
}

function toVehiculo(v: any): Vehiculo {
  return {
    id_vehiculo: v.id_vehiculo,
    id_empresa: v.id_empresa || 1,
    placa: (v.placa || '').toUpperCase(),
    marca: v.marca || '',
    modelo: v.modelo || '',
    anio: v.anio || new Date().getFullYear(),
    capacidad_toneladas: Number(v.capacidad_toneladas) || 0,
    estado_mantenimiento: ESTADO_VEHICULO_MAP[v.estado] || 'Operativo',
    fecha_mantenimiento: v.fecha_mantenimiento || null,
  };
}

function fromVehiculo(v: Vehiculo): any {
  return {
    id_vehiculo: v.id_vehiculo,
    id_empresa: v.id_empresa,
    placa: v.placa.toLowerCase(),
    marca: v.marca,
    modelo: v.modelo,
    anio: v.anio,
    capacidad_toneladas: v.capacidad_toneladas,
    estado: ESTADO_VEHICULO_REVERSE[v.estado_mantenimiento] || 'activo',
    fecha_mantenimiento: v.fecha_mantenimiento,
  };
}

function toMonitoreo(m: any): Monitoreo {
  return {
    id_monitoreo: m.id_monitoreo,
    id_vehiculo: m.id_vehiculo,
    id_conductor: m.id_conductor,
    id_ruta: m.id_ruta,
    fecha_salida: m.fecha_salida,
    fecha_llegada: m.fecha_llegada,
    estado: ESTADO_MONITOREO_MAP[m.estado] || 'En Ruta',
    tipo_carga: m.tipo_carga || null,
    createdAt: m.created_at || m.fecha_salida,
  };
}

function fromMonitoreo(m: Monitoreo): any {
  return {
    id_monitoreo: m.id_monitoreo,
    id_vehiculo: m.id_vehiculo,
    id_conductor: m.id_conductor,
    id_ruta: m.id_ruta,
    fecha_salida: m.fecha_salida,
    fecha_llegada: m.fecha_llegada,
    estado: ESTADO_MONITOREO_REVERSE[m.estado] || 'en transito',
    tipo_carga: m.tipo_carga,
  };
}

function toIncidencia(i: any): Incidencia {
  return {
    id_incidencia: i.id_incidencia,
    id_monitoreo: i.id_monitoreo,
    tipo: i.tipo || '',
    descripcion: i.descripcion || '',
    fecha_hora: i.fecha || i.created_at,
    reportado_por: typeof i.reportado_por === 'number' ? i.reportado_por : 0,
    estado_alerta: 'Pendiente',
  };
}

function fromIncidencia(i: Incidencia): any {
  return {
    id_incidencia: i.id_incidencia,
    id_monitoreo: i.id_monitoreo,
    tipo: i.tipo,
    descripcion: i.descripcion,
    fecha: i.fecha_hora,
    reportado_por: i.reportado_por.toString(),
  };
}

function toConductor(c: any) {
  return {
    id_conductor: c.id_conductor,
    nombre: c.nombre || '',
    apellido: c.apellido || '',
    licencia: c.licencia || '',
    telefono: c.telefono || null,
  };
}

function toRuta(r: any) {
  return {
    id_ruta: r.id_ruta,
    origen: r.origen || '',
    destino: r.destino || '',
    distancia_km: Number(r.distancia_km) || 0,
  };
}

function toConsumo(c: any) {
  return {
    id_consumo: c.id_consumo,
    id_monitoreo: c.id_monitoreo,
    cantidad_litros: Number(c.cantidad_litros) || 0,
    costo_total: Number(c.costo_total) || 0,
    fecha_registro: c.fecha_registro,
  };
}

function toMantenimiento(m: any) {
  return {
    id_mantenimiento: m.id_mantenimiento,
    id_vehiculo: m.id_vehiculo,
    descripcion: m.descripcion || '',
    fecha: m.fecha || '',
    costo: Number(m.costo) || 0,
  };
}

// ── FULL DATA LOAD ──

async function fetchAllRaw(): Promise<PetroMapiData> {
  const [
    { data: empresas },
    { data: usuarios },
    { data: vehiculos },
    { data: conductores },
    { data: rutas },
    { data: monitoreos },
    { data: consumos },
    { data: incidencias },
    { data: mantenimientos },
  ] = await Promise.all([
    supabase.from('empresa').select('*'),
    supabase.from('usuario').select('*'),
    supabase.from('vehiculo').select('*'),
    supabase.from('conductor').select('*'),
    supabase.from('ruta').select('*'),
    supabase.from('monitoreo').select('*').order('id_monitoreo', { ascending: false }),
    supabase.from('consumo_combustible').select('*'),
    supabase.from('incidencia').select('*'),
    supabase.from('mantenimiento').select('*'),
  ]);

  const dbData: PetroMapiData = {
    empresas: (empresas || []).map((e: any) => ({
      id_empresa: e.id_empresa,
      razon_social: e.razon_social || '',
      ruc: e.ruc || '',
      direccion: e.direccion || null,
      telefono: e.telefono || null,
    })),
    personales: (usuarios || []).map(toPersonal),
    modulos: [
      { id_modulo: 1, nombre_modulo: 'Monitoreo en Vivo' },
      { id_modulo: 2, nombre_modulo: 'Administración de Flota y Reportes' },
      { id_modulo: 3, nombre_modulo: 'Dashboard Ejecutivo' },
      { id_modulo: 4, nombre_modulo: 'Gestión de Flota Vehicular' },
    ],
    permisos_modulo: [],
    conductores: (conductores || []).map(toConductor),
    vehiculos: (vehiculos || []).map(toVehiculo),
    rutas: (rutas || []).map(toRuta),
    monitoreos: (monitoreos || []).map(toMonitoreo),
    consumos: (consumos || []).map(toConsumo),
    mantenimientos: (mantenimientos || []).map(toMantenimiento),
    incidencias: (incidencias || []).map(toIncidencia),
  };

  // Assign module permissions based on rol (no permisos_modulo table in SQL)
  dbData.personales.forEach((p) => {
    const allowedModules =
      p.rol === 'Administradores (Full Acceso)' || p.rol === 'Administrador'
        ? [1, 2, 3, 4]
        : p.rol === 'Supervisor de Control'
          ? [1, 2, 3, 4]
          : [1]; // operador → only monitoreo
    allowedModules.forEach((mId) => {
      if (!dbData.permisos_modulo.some((pm) => pm.id_personal === p.id_personal && pm.id_modulo === mId)) {
        dbData.permisos_modulo.push({ id_personal: p.id_personal, id_modulo: mId });
      }
    });
  });

  return ensureAdminAccs(dbData).data;
}

// ── FULL DATA PUSH ──

async function pushAllData(data: PetroMapiData): Promise<void> {
  const errors: string[] = [];

  for (const m of data.monitoreos) {
    const { error } = await supabase.from('monitoreo').upsert(fromMonitoreo(m));
    if (error) errors.push(`monitoreo: ${error.message}`);
  }
  for (const i of data.incidencias) {
    const { error } = await supabase.from('incidencia').upsert(fromIncidencia(i));
    if (error) errors.push(`incidencia: ${error.message}`);
  }
  for (const v of data.vehiculos) {
    const { error } = await supabase.from('vehiculo').upsert(fromVehiculo(v));
    if (error) errors.push(`vehiculo: ${error.message}`);
  }
  for (const m of data.mantenimientos) {
    const { error } = await supabase.from('mantenimiento').upsert({
      id_mantenimiento: m.id_mantenimiento,
      id_vehiculo: m.id_vehiculo,
      descripcion: m.descripcion,
      fecha: m.fecha,
      costo: m.costo,
    });
    if (error) errors.push(`mantenimiento: ${error.message}`);
  }
  for (const r of data.rutas) {
    const { error } = await supabase.from('ruta').upsert({
      id_ruta: r.id_ruta,
      origen: r.origen,
      destino: r.destino,
      distancia_km: r.distancia_km,
    });
    if (error) errors.push(`ruta: ${error.message}`);
  }
  for (const c of data.consumos) {
    const { error } = await supabase.from('consumo_combustible').upsert({
      id_consumo: c.id_consumo,
      id_monitoreo: c.id_monitoreo,
      cantidad_litros: c.cantidad_litros,
      costo_total: c.costo_total,
      fecha_registro: c.fecha_registro,
    });
    if (error) errors.push(`consumo: ${error.message}`);
  }
  for (const p of data.personales) {
    const { error } = await supabase.from('usuario').upsert(fromPersonal(p));
    if (error) errors.push(`usuario: ${error.message}`);
  }
  for (const c of data.conductores || []) {
    const id = (c as any).id_conductor;
    const { error } = await supabase.from('conductor').upsert({
      id_conductor: id || undefined,
      nombre: c.nombre,
      apellido: c.apellido,
      licencia: c.licencia,
      telefono: c.telefono,
    });
    if (error) errors.push(`conductor: ${error.message}`);
  }

  if (errors.length > 0) throw new Error(errors.join('; '));
}

// ── LOGIN ──

export async function loginUser(
  emailOrUser: string,
  password: string
): Promise<{ user: Personal | null; error: string | null }> {
  const { data: usuarios, error } = await supabase
    .from('usuario')
    .select('*')
    .or(`email.eq.${emailOrUser.toLowerCase().trim()}`);
  if (error) return { user: null, error: error.message };

  const userRow = usuarios && usuarios.length > 0 ? usuarios[0] : null;
  if (!userRow) return { user: null, error: 'Usuario no encontrado' };
  if (userRow.activo !== true) return { user: null, error: 'Cuenta inactiva' };

  const match = await bcrypt.compare(password, userRow.password_hash);
  if (!match) return { user: null, error: 'Contraseña incorrecta' };

  return { user: toPersonal(userRow), error: null };
}

// ── PUBLIC API ──

export async function loadAllData(): Promise<PetroMapiData> {
  return fetchAllRaw();
}

export async function syncAllData(data: PetroMapiData): Promise<void> {
  await pushAllData(data);
}

export function subscribeToRealtime(onData: (data: PetroMapiData) => void) {
  const channel = supabase
    .channel('petromapi_realtime_all')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'empresa' }, () => fetchAllRaw().then(onData).catch(console.warn))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'usuario' }, () => fetchAllRaw().then(onData).catch(console.warn))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'vehiculo' }, () => fetchAllRaw().then(onData).catch(console.warn))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'conductor' }, () => fetchAllRaw().then(onData).catch(console.warn))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ruta' }, () => fetchAllRaw().then(onData).catch(console.warn))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'monitoreo' }, () => fetchAllRaw().then(onData).catch(console.warn))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'consumo_combustible' }, () => fetchAllRaw().then(onData).catch(console.warn))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'incidencia' }, () => fetchAllRaw().then(onData).catch(console.warn))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'mantenimiento' }, () => fetchAllRaw().then(onData).catch(console.warn))
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export const supabaseConnectionDetails = {
  url: supabaseUrl,
  projectName: supabaseUrl.replace('https://', '').split('.')[0],
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Empresa,
  Personal,
  Modulo,
  PermisoModulo,
  Conductor,
  Vehiculo,
  Ruta,
  Monitoreo,
  ConsumoCombustible,
  Mantenimiento,
  Incidencia
} from './types';

export interface PetroMapiData {
  empresas: Empresa[];
  personales: Personal[];
  modulos: Modulo[];
  permisos_modulo: PermisoModulo[];
  conductores: Conductor[];
  vehiculos: Vehiculo[];
  rutas: Ruta[];
  monitoreos: Monitoreo[];
  consumos: ConsumoCombustible[];
  mantenimientos: Mantenimiento[];
  incidencias: Incidencia[];
}

const STORAGE_KEY = 'petromapi_db_state';

// Seeds initial data (synced with Supabase)
const SEED_DATA: PetroMapiData = {
  empresas: [
    { id_empresa: 1, razon_social: 'Petro Mapi SAC', ruc: '20609382912', direccion: 'Av. Industrial 450, Lima, Peru', telefono: '01-4402928' },
    { id_empresa: 2, razon_social: 'Carga Ancha Andina S.R.L.', ruc: '20456789012', direccion: 'Av. La Cultura 456, Cusco', telefono: '912345678' },
    { id_empresa: 3, razon_social: 'Logistica del Norte SAC', ruc: '20567890123', direccion: 'Av. Panamericana 789, Trujillo', telefono: '976543210' },
    { id_empresa: 4, razon_social: 'Transportes Internacionales Volvo SAC', ruc: '20678901234', direccion: 'Av. Javier Prado 321, Lima', telefono: '934567890' },
    { id_empresa: 5, razon_social: 'Megacarga Peru E.I.R.L.', ruc: '20789012345', direccion: 'Av. Grau 654, Arequipa', telefono: '945678901' },
    { id_empresa: 6, razon_social: 'Altiplano Cargo S.A.', ruc: '20890123456', direccion: 'Jr. Puno 321, Puno', telefono: '987111222' },
    { id_empresa: 7, razon_social: 'Amazonas Express S.R.L.', ruc: '20901234567', direccion: 'Av. Selva Alegre 789, Chachapoyas', telefono: '987333444' },
    { id_empresa: 8, razon_social: 'Logistica Sur Andina SAC', ruc: '21012345678', direccion: 'Av. Mariscal Gamarra 456, Juliaca', telefono: '987444555' },
    { id_empresa: 9, razon_social: 'Transporte Rapido Norte S.A.', ruc: '21123456789', direccion: 'Av. Libertad 789, Chiclayo', telefono: '987555666' },
    { id_empresa: 10, razon_social: 'Carga Internacional Andes SAC', ruc: '21234567890', direccion: 'Av. Los Incas 123, Huancayo', telefono: '987666777' }
  ],
  personales: [
    { id_personal: 1, nombre_completo: 'Kefren', usuario: 'Kefren', correo: 'kefren@petromapi.com', contrasena: 'Kefren123', rol: 'Administradores (Full Acceso)', estado: 1 },
    { id_personal: 2, nombre_completo: 'Ricardo Mendoza', usuario: 'rmendoza@petromapi.com', correo: 'rmendoza@petromapi.com', contrasena: 'Petro2026', rol: 'Supervisor de Control', estado: 1 },
    { id_personal: 3, nombre_completo: 'Elena Castillo', usuario: 'ecastillo@petromapi.com', correo: 'ecastillo@petromapi.com', contrasena: 'Petro2026', rol: 'Conductor de Ruta (Chofer de unidad)', estado: 1 },
    { id_personal: 4, nombre_completo: 'Jorge Valdivia', usuario: 'jvaldivia@petromapi.com', correo: 'jvaldivia@petromapi.com', contrasena: 'Petro2026', rol: 'Conductor de Ruta (Chofer de unidad)', estado: 0 },
    { id_personal: 5, nombre_completo: 'Sofia Ramos', usuario: 'sramos@petromapi.com', correo: 'sramos@petromapi.com', contrasena: 'Petro2026', rol: 'Supervisor de Control', estado: 1 },
    { id_personal: 10, nombre_completo: 'Admin Petro Mapi', usuario: 'admin@petromapi.com', correo: 'admin@petromapi.com', contrasena: 'petromapisac123', rol: 'Administradores (Full Acceso)', estado: 1 }
  ],
  modulos: [
    { id_modulo: 1, nombre_modulo: 'Monitoreo en Vivo' },
    { id_modulo: 2, nombre_modulo: 'Administracion de Flota y Reportes' },
    { id_modulo: 3, nombre_modulo: 'Dashboard Ejecutivo' },
    { id_modulo: 4, nombre_modulo: 'Gestion de Flota Vehicular' }
  ],
  permisos_modulo: [
    { id_personal: 1, id_modulo: 1 }, { id_personal: 1, id_modulo: 2 }, { id_personal: 1, id_modulo: 3 }, { id_personal: 1, id_modulo: 4 },
    { id_personal: 2, id_modulo: 1 }, { id_personal: 2, id_modulo: 4 },
    { id_personal: 3, id_modulo: 1 }, { id_personal: 3, id_modulo: 2 },
    { id_personal: 5, id_modulo: 2 }, { id_personal: 5, id_modulo: 3 },
    { id_personal: 10, id_modulo: 1 }, { id_personal: 10, id_modulo: 2 }, { id_personal: 10, id_modulo: 3 }, { id_personal: 10, id_modulo: 4 }
  ],
  conductores: [
    { id_conductor: 1, nombre: 'Ricardo', apellido: 'Castillo Mora', licencia: 'Q283726A', telefono: '938291029' },
    { id_conductor: 2, nombre: 'Juan', apellido: 'Perez Soto', licencia: 'A382103B', telefono: '928371928' },
    { id_conductor: 3, nombre: 'Maria', apellido: 'Alva Ramos', licencia: 'M328102C', telefono: '910283711' },
    { id_conductor: 4, nombre: 'Luis', apellido: 'Loli', licencia: 'L382910D', telefono: '901293812' },
    { id_conductor: 5, nombre: 'Sandra', apellido: 'Meza', licencia: 'S291029L', telefono: '972831021' },
    { id_conductor: 6, nombre: 'Arturo', apellido: 'Torres', licencia: 'A283910M', telefono: '965431029' },
    { id_conductor: 7, nombre: 'Miguel', apellido: 'Canales', licencia: 'MC938291', telefono: '982738192' },
    { id_conductor: 8, nombre: 'Pedro', apellido: 'Gutierrez', licencia: 'LIC33333', telefono: '987333555' },
    { id_conductor: 9, nombre: 'Rosa', apellido: 'Flores', licencia: 'LIC44444', telefono: '987444666' },
    { id_conductor: 10, nombre: 'Miguel', apellido: 'Castro', licencia: 'LIC55555', telefono: '987555777' }
  ],
  vehiculos: [
    { id_vehiculo: 1, id_empresa: 1, placa: 'V3B-981', marca: 'Volvo', modelo: 'FH16 - 2023', anio: 2023, capacidad_toneladas: 32.0, estado_mantenimiento: 'Operativo', fecha_mantenimiento: '2024-05-24' },
    { id_vehiculo: 2, id_empresa: 1, placa: 'B4X-112', marca: 'Scania', modelo: 'G410', anio: 2022, capacidad_toneladas: 32.0, estado_mantenimiento: 'En Taller', fecha_mantenimiento: '2024-05-20' },
    { id_vehiculo: 3, id_empresa: 1, placa: 'P8C-455', marca: 'Mercedes-Benz', modelo: 'Actros', anio: 2021, capacidad_toneladas: 30.5, estado_mantenimiento: 'Operativo', fecha_mantenimiento: '2024-05-23' },
    { id_vehiculo: 4, id_empresa: 1, placa: 'M7S-331', marca: 'Volvo', modelo: 'FH12', anio: 2020, capacidad_toneladas: 35.0, estado_mantenimiento: 'Operativo', fecha_mantenimiento: '2024-05-24' },
    { id_vehiculo: 5, id_empresa: 1, placa: 'V7C-982', marca: 'Volvo', modelo: 'FMX 460 6x4', anio: 2022, capacidad_toneladas: 32.0, estado_mantenimiento: 'Operativo', fecha_mantenimiento: '2023-10-15' },
    { id_vehiculo: 6, id_empresa: 1, placa: 'B3X-115', marca: 'Scania', modelo: 'R540 Streamline', anio: 2021, capacidad_toneladas: 45.0, estado_mantenimiento: 'Operativo', fecha_mantenimiento: '2024-01-02' },
    { id_vehiculo: 7, id_empresa: 1, placa: 'F9L-403', marca: 'Mercedes-Benz', modelo: 'Actros 2645', anio: 2023, capacidad_toneladas: 30.5, estado_mantenimiento: 'En Taller', fecha_mantenimiento: '2024-05-02' },
    { id_vehiculo: 8, id_empresa: 1, placa: 'A1Q-772', marca: 'Kenworth', modelo: 'T880 Heavy Duty', anio: 2020, capacidad_toneladas: 50.0, estado_mantenimiento: 'Operativo', fecha_mantenimiento: '2023-12-12' },
    { id_vehiculo: 9, id_empresa: 1, placa: 'M5T-229', marca: 'International', modelo: 'HV Series 6x4', anio: 2019, capacidad_toneladas: 28.0, estado_mantenimiento: 'Operativo', fecha_mantenimiento: '2024-03-05' },
    { id_vehiculo: 10, id_empresa: 9, placa: 'MAN-444', marca: 'MAN', modelo: 'TGS', anio: 2022, capacidad_toneladas: 30.0, estado_mantenimiento: 'Operativo', fecha_mantenimiento: '2026-04-28' },
    { id_vehiculo: 11, id_empresa: 1, placa: 'IAM-765', marca: 'Volvo', modelo: 'FOC 456', anio: 2026, capacidad_toneladas: 55.0, estado_mantenimiento: 'Operativo', fecha_mantenimiento: '2026-06-22' }
  ],
  rutas: [
    { id_ruta: 1, origen: 'Cusco', destino: 'Arequipa', distancia_km: 480.5 },
    { id_ruta: 2, origen: 'Lima', destino: 'Trujillo', distancia_km: 560.0 },
    { id_ruta: 3, origen: 'Puno', destino: 'Tacna', distancia_km: 320.0 },
    { id_ruta: 4, origen: 'Lima', destino: 'Cusco', distancia_km: 1100.0 },
    { id_ruta: 5, origen: 'Arequipa', destino: 'Moquegua', distancia_km: 180.0 },
    { id_ruta: 6, origen: 'Iquitos', destino: 'Tarapoto', distancia_km: 370.0 },
    { id_ruta: 7, origen: 'Huancayo', destino: 'Lima', distancia_km: 300.0 },
    { id_ruta: 8, origen: 'Piura', destino: 'Chiclayo', distancia_km: 210.0 },
    { id_ruta: 9, origen: 'Trujillo', destino: 'Chimbote', distancia_km: 130.0 },
    { id_ruta: 10, origen: 'Ayacucho', destino: 'Ica', distancia_km: 420.0 }
  ],
  monitoreos: [
    { id_monitoreo: 1, id_vehiculo: 1, id_conductor: 1, id_ruta: 1, fecha_salida: '2026-06-18T06:45:00', fecha_llegada: '2026-04-25T18:30:00', estado: 'En Ruta', tipo_carga: 'Combustible Diesel B5 S50', createdAt: '2026-06-18T06:45:00' },
    { id_monitoreo: 2, id_vehiculo: 2, id_conductor: 2, id_ruta: 2, fecha_salida: '2026-06-18T04:20:00', fecha_llegada: null, estado: 'En Ruta', tipo_carga: 'Manganeso Concentrado', createdAt: '2026-06-18T04:20:00' },
    { id_monitoreo: 3, id_vehiculo: 3, id_conductor: 3, id_ruta: 3, fecha_salida: '2026-06-17T22:15:00', fecha_llegada: '2026-06-18T03:45:00', estado: 'Completado', tipo_carga: 'Gas Licuado GLP', createdAt: '2026-06-17T22:15:00' },
    { id_monitoreo: 4, id_vehiculo: 4, id_conductor: 4, id_ruta: 4, fecha_salida: '2026-06-18T09:00:00', fecha_llegada: '2026-04-29T15:00:00', estado: 'En Ruta', tipo_carga: 'Gasolina Premium 97', createdAt: '2026-06-18T09:00:00' },
    { id_monitoreo: 5, id_vehiculo: 9, id_conductor: 6, id_ruta: 9, fecha_salida: '2026-06-18T10:15:00', fecha_llegada: null, estado: 'En Ruta', tipo_carga: 'Asfalto Liquido PEN', createdAt: '2026-06-18T10:15:00' },
    { id_monitoreo: 6, id_vehiculo: 6, id_conductor: 6, id_ruta: 6, fecha_salida: '2026-05-01T07:00:00', fecha_llegada: null, estado: 'En Ruta', tipo_carga: 'Carga Seca', createdAt: '2026-05-01T07:00:00' },
    { id_monitoreo: 7, id_vehiculo: 7, id_conductor: 7, id_ruta: 7, fecha_salida: '2026-05-02T08:00:00', fecha_llegada: null, estado: 'En Ruta', tipo_carga: 'Carga Pesada', createdAt: '2026-05-02T08:00:00' },
    { id_monitoreo: 8, id_vehiculo: 8, id_conductor: 8, id_ruta: 8, fecha_salida: '2026-05-03T09:00:00', fecha_llegada: '2026-05-03T14:00:00', estado: 'Completado', tipo_carga: 'Carga Seca', createdAt: '2026-05-03T09:00:00' },
    { id_monitoreo: 9, id_vehiculo: 9, id_conductor: 9, id_ruta: 9, fecha_salida: '2026-05-04T06:30:00', fecha_llegada: null, estado: 'En Ruta', tipo_carga: 'Carga Liquida', createdAt: '2026-05-04T06:30:00' },
    { id_monitoreo: 10, id_vehiculo: 10, id_conductor: 10, id_ruta: 10, fecha_salida: '2026-05-05T10:00:00', fecha_llegada: null, estado: 'En Ruta', tipo_carga: 'Carga Seca', createdAt: '2026-05-05T10:00:00' }
  ],
  consumos: [
    { id_consumo: 1, id_monitoreo: 1, cantidad_litros: 310, costo_total: 5120.0, fecha_registro: '2026-06-18T07:15:00' },
    { id_consumo: 2, id_monitoreo: 2, cantidad_litros: 420, costo_total: 6930.0, fecha_registro: '2026-06-18T05:00:00' },
    { id_consumo: 3, id_monitoreo: 3, cantidad_litros: 120, costo_total: 1980.0, fecha_registro: '2026-06-18T04:00:00' },
    { id_consumo: 4, id_monitoreo: 4, cantidad_litros: 140, costo_total: 2310.0, fecha_registro: '2026-06-18T10:00:00' }
  ],
  mantenimientos: [
    { id_mantenimiento: 1, id_vehiculo: 1, descripcion: 'Inspeccion tecnica general', fecha: '2026-05-24', costo: 1250.00 },
    { id_mantenimiento: 2, id_vehiculo: 5, descripcion: 'Alineacion de ejes', fecha: '2026-04-15', costo: 980.00 },
    { id_mantenimiento: 3, id_vehiculo: 7, descripcion: 'Cambio de liquido de frenos', fecha: '2026-05-02', costo: 1500.00 }
  ],
  incidencias: [
    { id_incidencia: 1, id_monitoreo: 2, tipo: 'Perdida de senal GPS', descripcion: 'El rastreador satelital principal interrumpio el reporte en el Km 450', fecha_hora: '2026-06-18T11:21:00', reportado_por: 0, estado_alerta: 'Pendiente' },
    { id_incidencia: 2, id_monitoreo: 1, tipo: 'Falla de presion', descripcion: 'Ligera caida de presion en neumaticos', fecha_hora: '2026-06-18T08:34:00', reportado_por: 0, estado_alerta: 'Pendiente' }
  ]
};

export function ensureAdminAccs(dbData: PetroMapiData): { data: PetroMapiData; modified: boolean } {
  const requiredAdmin = {
    id_personal: 1,
    nombre_completo: 'Kefren',
    usuario: 'Kefren',
    correo: 'kefren@petromapi.com',
    contrasena: 'Kefren123',
    rol: 'Administradores (Full Acceso)',
    estado: 1
  };

  let modified = false;
  let personalesCopy = dbData.personales ? [...dbData.personales] : [];
  let permisosCopy = dbData.permisos_modulo ? [...dbData.permisos_modulo] : [];

  // Remove administrative/legacy user accounts who are not Kefren (filtering out legacy IDs and old usernames)
  const beforeLength = personalesCopy.length;
  personalesCopy = personalesCopy.filter(p => {
    const isLegacyAdmin =
      p.id_personal === 11 ||
      p.id_personal === 12 ||
      p.usuario.toLowerCase() === 'admin' ||
      p.usuario.toLowerCase() === '018100461a' ||
      p.usuario.toLowerCase() === '018100461a@gmail.com' ||
      (p.usuario.toLowerCase() === 'kefren' && p.id_personal === 10); // delete duplicate Kefren at ID 10
    return !isLegacyAdmin;
  });

  if (personalesCopy.length !== beforeLength) {
    modified = true;
  }

  // Ensure Kefren exists with correct password & role under id_personal: 1
  const existingIndex = personalesCopy.findIndex(p => p.usuario.toLowerCase() === 'kefren');
  if (existingIndex === -1) {
    personalesCopy.push(requiredAdmin);
    modified = true;
  } else {
    const existing = personalesCopy[existingIndex];
    if (existing.contrasena !== requiredAdmin.contrasena || existing.rol !== requiredAdmin.rol || existing.estado !== 1 || existing.id_personal !== 1) {
      personalesCopy[existingIndex] = {
        ...existing,
        id_personal: 1,
        contrasena: requiredAdmin.contrasena,
        rol: requiredAdmin.rol,
        estado: 1
      };
      modified = true;
    }
  }

  // Remove permissions associated with deleted administrator IDs
  const beforePermsLength = permisosCopy.length;
  permisosCopy = permisosCopy.filter(pm => pm.id_personal !== 11 && pm.id_personal !== 12);
  if (permisosCopy.length !== beforePermsLength) {
    modified = true;
  }

  // Ensure Kefren (id_personal: 1) has all 4 module permissions
  const kefrenId = personalesCopy.find(p => p.usuario.toLowerCase() === 'kefren')?.id_personal || 1;
  const requiredModules = [1, 2, 3, 4];
  for (const modId of requiredModules) {
    const hasPerm = permisosCopy.some(pm => pm.id_personal === kefrenId && pm.id_modulo === modId);
    if (!hasPerm) {
      permisosCopy.push({ id_personal: kefrenId, id_modulo: modId });
      modified = true;
    }
  }

  return {
    data: {
      ...dbData,
      personales: personalesCopy,
      permisos_modulo: permisosCopy
    },
    modified
  };
}

export function getDB(): PetroMapiData {
  const raw = localStorage.getItem(STORAGE_KEY);
  let dbData: PetroMapiData;
  if (!raw) {
    dbData = SEED_DATA;
  } else {
    try {
      dbData = JSON.parse(raw);
    } catch (e) {
      dbData = SEED_DATA;
    }
  }

  const result = ensureAdminAccs(dbData);
  if (result.modified) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result.data));
  }
  return result.data;
}

export function saveDB(data: PetroMapiData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Helpers for querying & editing relational tables
export function resetDB(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
}

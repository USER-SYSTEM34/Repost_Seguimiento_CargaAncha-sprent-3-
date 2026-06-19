/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { getDB, saveDB, resetDB, ensureAdminAccs } from './db';
import { Personal, Modulo, PermisoModulo, Monitoreo, Vehiculo, Conductor, Ruta, Incidencia, Mantenimiento } from './types';
import { loadAllData, syncAllData, subscribeToRealtime, supabaseConnectionDetails } from './supabase';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import MonitoreoView from './components/MonitoreoView';
import FlotaView from './components/FlotaView';
import RutasView from './components/RutasView';
import IncidenciasView from './components/IncidenciasView';
import PersonalView from './components/PersonalView';

export default function App() {
  // Database active simulated state reactive
  const [db, setDb] = useState(() => getDB());

  // Togglable Cloud Sync State (persists in localStorage)
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(() => {
    const saved = localStorage.getItem('petromapi_cloud_sync_enabled');
    return saved !== 'false';
  });

  // Cloud Firestore database connection status
  const [cloudStatus, setCloudStatus] = useState({
    connected: false,
    error: null as string | null,
    lastSync: 'Conectando...'
  });

  // Subscribe to real-time updates from Supabase if enabled
  useEffect(() => {
    if (!cloudSyncEnabled) {
      setCloudStatus({
        connected: false,
        error: 'Sincronización desactivada en Ajustes (Modo Local Seguro).',
        lastSync: 'Local Cache'
      });
      return;
    }

    setCloudStatus({
      connected: false,
      error: null,
      lastSync: 'Cargando...'
    });

    // Load all data from normalized tables in parallel
    loadAllData()
      .then((cloudData) => {
        const sanitized = ensureAdminAccs(cloudData);
        setDb(sanitized.data);
        saveDB(sanitized.data);
        if (sanitized.modified) {
          syncAllData(sanitized.data).catch((err) => {
            console.warn('Deferred back-sync of admins to cloud:', err.message);
          });
        }
        setCloudStatus({
          connected: true,
          error: null,
          lastSync: new Date().toLocaleTimeString()
        });
      })
      .catch((err) => {
        console.warn('Initial load from Supabase failed:', err);
        setCloudStatus({
          connected: false,
          error: err.message,
          lastSync: 'Error'
        });
      });

    // Subscribe to realtime changes on key tables
    const unsubRealtime = subscribeToRealtime((cloudData) => {
      const sanitized = ensureAdminAccs(cloudData);
      setDb(sanitized.data);
      saveDB(sanitized.data);
      setCloudStatus({
        connected: true,
        error: null,
        lastSync: new Date().toLocaleTimeString()
      });
    });

    return () => {
      unsubRealtime();
    };
  }, [cloudSyncEnabled]);

  // Logged user profile session
  const [currentUser, setCurrentUser] = useState<Personal | null>(null);

  // Navigation tab route state
  const [currentTab, setCurrentTab] = useState('dashboard');

  // Search filter terms
  const [searchTerm, setSearchTerm] = useState('');

  // Persist session state changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('petromapi_session_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('petromapi_session_user');
    }
  }, [currentUser]);

  // Keep db synced to storage & Supabase
  const updateDBState = (updater: (prev: typeof db) => typeof db) => {
    setDb((prev) => {
      const next = updater(prev);
      saveDB(next);
      if (cloudSyncEnabled) {
        syncAllData(next).catch((err) => {
          console.error('Failed to sync to Supabase:', err);
        });
      }
      return next;
    });
  };

  const handleLoginSuccess = (user: Personal) => {
    setCurrentUser(user);
    // Redirect to permitted modules
    if (user.rol === 'Administrador' || user.rol === 'Administradores (Full Acceso)') {
      setCurrentTab('dashboard');
    } else {
      // Find what modules worker is allowed
      const allowedModuleIds = db.permisos_modulo
        .filter((pm) => pm.id_personal === user.id_personal)
        .map((pm) => pm.id_modulo);
      
      const firstAllowed = db.modulos.find((m) => allowedModuleIds.includes(m.id_modulo));
      if (firstAllowed) {
        if (firstAllowed.nombre_modulo.includes('Monitoreo')) setCurrentTab('monitoreo');
        else if (firstAllowed.nombre_modulo.includes('Flota')) setCurrentTab('flota');
        else if (firstAllowed.nombre_modulo.includes('Dashboard')) setCurrentTab('dashboard');
        else setCurrentTab('monitoreo');
      } else {
        setCurrentTab('monitoreo'); // fallback
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentTab('dashboard');
    setSearchTerm('');
  };

  // Add cross-relational operations
  const handleAddMonitoreo = (trip: Omit<Monitoreo, 'id_monitoreo' | 'createdAt'>) => {
    updateDBState((prev) => {
      const nextId = prev.monitoreos.reduce((max, m) => Math.max(max, m.id_monitoreo), 0) + 1;
      const newTrip: Monitoreo = {
        ...trip,
        id_monitoreo: nextId,
        createdAt: new Date().toISOString()
      };
      return {
        ...prev,
        monitoreos: [newTrip, ...prev.monitoreos]
      };
    });
  };

  const handleUpdateMonitoreoStatus = (id: number, status: 'En Ruta' | 'Completado' | 'Incidencia') => {
    updateDBState((prev) => {
      const updated = prev.monitoreos.map((m) => {
        if (m.id_monitoreo === id) {
          return {
            ...m,
            estado: status,
            fecha_llegada: status === 'Completado' ? new Date().toISOString() : null
          };
        }
        return m;
      });
      return {
        ...prev,
        monitoreos: updated
      };
    });
  };

  const handleAddIncidencia = (inc: Omit<Incidencia, 'id_incidencia' | 'fecha_hora'>) => {
    updateDBState((prev) => {
      const nextId = prev.incidencias.reduce((max, i) => Math.max(max, i.id_incidencia), 0) + 1;
      const newInc: Incidencia = {
        ...inc,
        id_incidencia: nextId,
        fecha_hora: new Date().toISOString()
      };
      return {
        ...prev,
        incidencias: [newInc, ...prev.incidencias]
      };
    });
  };

  const handleAddVehiculo = (veh: Omit<Vehiculo, 'id_vehiculo'>) => {
    updateDBState((prev) => {
      const nextId = prev.vehiculos.reduce((max, v) => Math.max(max, v.id_vehiculo), 0) + 1;
      const newVeh: Vehiculo = {
        ...veh,
        id_vehiculo: nextId
      };
      return {
        ...prev,
        vehiculos: [...prev.vehiculos, newVeh]
      };
    });
  };

  const handleAddMantenimiento = (maint: Omit<Mantenimiento, 'id_mantenimiento'>) => {
    updateDBState((prev) => {
      const nextId = prev.mantenimientos.reduce((max, m) => Math.max(max, m.id_mantenimiento), 0) + 1;
      const newMaint: Mantenimiento = {
        ...maint,
        id_mantenimiento: nextId
      };
      return {
        ...prev,
        mantenimientos: [...prev.mantenimientos, newMaint]
      };
    });
  };

  const handleAddRuta = (route: Omit<Ruta, 'id_ruta'>) => {
    updateDBState((prev) => {
      const nextId = prev.rutas.reduce((max, r) => Math.max(max, r.id_ruta), 0) + 1;
      const newRoute: Ruta = {
        ...route,
        id_ruta: nextId
      };
      return {
        ...prev,
        rutas: [...prev.rutas, newRoute]
      };
    });
  };

  const handleAddPersonal = (worker: Omit<Personal, 'id_personal'>, selectedModuleIds: number[]) => {
    updateDBState((prev) => {
      const nextId = prev.personales.reduce((max, p) => Math.max(max, p.id_personal), 0) + 1;
      const newPersonal: Personal = {
        ...worker,
        id_personal: nextId
      };
      
      // Setup modules permissions records as requested by database interlocks
      const newPermissions = selectedModuleIds.map((mId) => ({
        id_personal: nextId,
        id_modulo: mId
      }));

      return {
        ...prev,
        personales: [...prev.personales, newPersonal],
        permisos_modulo: [...prev.permisos_modulo, ...newPermissions]
      };
    });
  };

  const handleEditPersonal = (id: number, updated: Partial<Personal>, selectedModuleIds?: number[]) => {
    updateDBState((prev) => {
      const updatedPersonales = prev.personales.map((p) => {
        if (p.id_personal === id) {
          return {
            ...p,
            ...updated
          };
        }
        return p;
      });

      let updatedPermisos = prev.permisos_modulo;
      if (selectedModuleIds !== undefined) {
        const otherPermisos = prev.permisos_modulo.filter(pm => pm.id_personal !== id);
        const newPermisos = selectedModuleIds.map((mId) => ({
          id_personal: id,
          id_modulo: mId
        }));
        updatedPermisos = [...otherPermisos, ...newPermisos];
      }

      return {
        ...prev,
        personales: updatedPersonales,
        permisos_modulo: updatedPermisos
      };
    });

    // Also sync the currentUser if editing themselves!
    if (currentUser && currentUser.id_personal === id) {
      setCurrentUser(prevUser => {
        if (!prevUser) return null;
        return {
          ...prevUser,
          ...updated
        };
      });
    }
  };

  // Profile editing state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileNombre, setProfileNombre] = useState('');
  const [profileUsuario, setProfileUsuario] = useState('');
  const [profileCorreo, setProfileCorreo] = useState('');
  const [profileContrasena, setProfileContrasena] = useState('');

  const handleOpenProfileModal = () => {
    if (!currentUser) return;
    setProfileNombre(currentUser.nombre_completo);
    setProfileUsuario(currentUser.usuario);
    setProfileCorreo(currentUser.correo);
    setProfileContrasena(currentUser.contrasena);
    setShowProfileModal(true);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!profileNombre || !profileUsuario || !profileCorreo || !profileContrasena) {
      alert('Por favor llene todos los campos del perfil.');
      return;
    }

    handleEditPersonal(currentUser.id_personal, {
      nombre_completo: profileNombre,
      usuario: profileUsuario.trim(),
      correo: profileCorreo.trim(),
      contrasena: profileContrasena,
    });

    alert('Tu perfil personal ha sido actualizado exitosamente.');
    setShowProfileModal(false);
  };

  const handleToggleStatus = (id: number) => {
    updateDBState((prev) => {
      const updated = prev.personales.map((p) => {
        if (p.id_personal === id) {
          return {
            ...p,
            estado: p.estado === 1 ? 0 : 1
          };
        }
        return p;
      });
      return {
        ...prev,
        personales: updated
      };
    });
  };

  const handleDeletePersonal = (id: number) => {
    if (currentUser?.id_personal === id) {
      alert('Error: No se puede dar de baja su propio usuario activo.');
      return;
    }
    updateDBState((prev) => {
      return {
        ...prev,
        personales: prev.personales.filter((p) => p.id_personal !== id),
        permisos_modulo: prev.permisos_modulo.filter((pm) => pm.id_personal !== id)
      };
    });
    alert('Operador dado de baja del sistema exitosamente.');
  };

  const handleSolveIncident = (id: number) => {
    updateDBState((prev) => {
      // Find the incident
      const incident = prev.incidencias.find((i) => i.id_incidencia === id);
      if (!incident) return prev;

      // Mark incident as solved
      const updatedIncidents = prev.incidencias.map((i) => {
        if (i.id_incidencia === id) {
          return {
            ...i,
            estado_alerta: 'Resuelto' as const
          };
        }
        return i;
      });

      // Update associated trip back to 'En Ruta'
      const updatedMonitoreo = prev.monitoreos.map((m) => {
        if (m.id_monitoreo === incident.id_monitoreo) {
          return {
            ...m,
            estado: 'En Ruta' as const
          };
        }
        return m;
      });

      return {
        ...prev,
        incidencias: updatedIncidents,
        monitoreos: updatedMonitoreo
      };
    });
    alert('Alerta solucionada. La cisterna de tramo asociada reanudó operaciones normales.');
  };

  // If not logged, present the credentials gate
  if (!currentUser) {
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // Find user modules permissions
  const userPermissions = db.modulos.filter((m) => 
    db.permisos_modulo.some((pm) => pm.id_personal === currentUser.id_personal && pm.id_modulo === m.id_modulo)
  );

  // Active alarms list count
  const activeIncidentsList = db.incidencias.filter((i) => i.estado_alerta === 'Pendiente');

  return (
    <div id="application-layout" className="min-h-screen bg-background text-[#cbd5e1] antialiased">
      {/* LEFT DRAWER MENU PANEL Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        userPermissions={userPermissions}
        cloudStatus={cloudStatus}
        dbDetails={supabaseConnectionDetails}
      />

      {/* RIGHT DISPLAY STAGE */}
      <div id="content-stage" className="pl-64 pt-16">
        <Header
          title={currentTab}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          currentUser={currentUser}
          activeIncidents={activeIncidentsList}
          onSolveIncident={handleSolveIncident}
          onProfileClick={handleOpenProfileModal}
        />

        <main className="p-10 max-w-7xl mx-auto min-h-[calc(100vh-4rem)]">
          {currentTab === 'dashboard' && (
            <DashboardView
              monitoreos={db.monitoreos}
              vehiculos={db.vehiculos}
              rutas={db.rutas}
              consumos={db.consumos}
            />
          )}

          {currentTab === 'monitoreo' && (
            <MonitoreoView
              monitoreos={db.monitoreos}
              vehiculos={db.vehiculos}
              conductores={db.conductores}
              rutas={db.rutas}
              incidencias={db.incidencias}
              consumos={db.consumos}
              currentUser={currentUser}
              searchTerm={searchTerm}
              onAddMonitoreo={handleAddMonitoreo}
              onUpdateMonitoreoStatus={handleUpdateMonitoreoStatus}
              onAddIncidencia={handleAddIncidencia}
            />
          )}

          {currentTab === 'flota' && (
            <FlotaView
              vehiculos={db.vehiculos}
              mantenimientos={db.mantenimientos}
              incidencias={db.incidencias}
              monitoreos={db.monitoreos}
              onAddVehiculo={handleAddVehiculo}
              onAddMantenimiento={handleAddMantenimiento}
              onAddIncidencia={handleAddIncidencia}
              onUpdateMonitoreoStatus={handleUpdateMonitoreoStatus}
              searchTerm={searchTerm}
            />
          )}

          {currentTab === 'rutas' && (
            <RutasView
              rutas={db.rutas}
              onAddRuta={handleAddRuta}
              searchTerm={searchTerm}
            />
          )}

          {currentTab === 'incidencias' && (
            <IncidenciasView
              incidencias={db.incidencias}
              monitoreos={db.monitoreos}
              vehiculos={db.vehiculos}
              searchTerm={searchTerm}
              onAddIncidencia={handleAddIncidencia}
              onSolveIncident={handleSolveIncident}
            />
          )}

          {currentTab === 'usuarios' && (
            <PersonalView
              personales={db.personales}
              modulos={db.modulos}
              permisos_modulo={db.permisos_modulo}
              currentUser={currentUser}
              onAddPersonal={handleAddPersonal}
              onEditPersonal={handleEditPersonal}
              onToggleStatus={handleToggleStatus}
              onDeletePersonal={handleDeletePersonal}
              searchTerm={searchTerm}
            />
          )}

          {currentTab === 'ajustes' && (
            <div className="space-y-6 max-w-3xl mx-auto select-none">
              {/* Database Connection Status Card */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-black font-sans text-slate-100 uppercase tracking-wider">📦 Conexión a Base de Datos Cloud</h3>
                    <p className="text-[11px] text-slate-400 font-mono">Estado de sincronización en caliente con Supabase PostgreSQL.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full ${cloudStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                    <span className={`text-xs font-black font-sans uppercase tracking-wider ${cloudStatus.connected ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {cloudStatus.connected ? 'Conectado (Live)' : 'Buscando servidor...'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-950 p-3 rounded border border-slate-850 space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-sans">Detalles del Endpoint</p>
                    <div className="space-y-1 font-mono text-slate-300">
                      <div><strong className="text-slate-400">Motor:</strong> Supabase PostgreSQL 15</div>
                      <div><strong className="text-slate-400">Proyecto:</strong> {supabaseConnectionDetails.projectName}</div>
                      <div><strong className="text-slate-400">Tablas:</strong> 9 tablas normalizadas</div>
                      <div><strong className="text-slate-400">Host:</strong> {supabaseConnectionDetails.url}</div>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded border border-slate-850 space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-sans">Sincronización en Tiempo Real</p>
                    <div className="space-y-1 font-mono text-slate-300">
                      <div><strong className="text-slate-400">Estrategia:</strong> Supabase Realtime (Postgres Changes)</div>
                      <div><strong className="text-slate-400">Último Sync:</strong> <span className="text-emerald-400 font-bold">{cloudStatus.lastSync}</span></div>
                      <div><strong className="text-slate-400">Esquema:</strong> public (empresa, usuario, vehiculo, ...)</div>
                      <div><strong className="text-slate-400">Conexión:</strong> Anon Key + JWT</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-sans">Configuración de Conexión (.env)</p>
                  <pre className="bg-slate-950 p-3 rounded border border-slate-850 text-[10px] text-slate-400 font-mono overflow-x-auto select-all leading-relaxed">
{`VITE_SUPABASE_URL=${supabaseConnectionDetails.url}
VITE_SUPABASE_ANON_KEY=**********************`}
                  </pre>
                  <p className="text-[9px] text-slate-500 font-mono">⚠️ Configure VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en su archivo .env para producción.</p>
                </div>
              </div>

              {/* Maintenance Tools */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-4">
                  <div>
                    <h3 className="text-base font-black font-sans text-slate-100 uppercase tracking-wider">🛠️ Caja de Herramientas de Administración</h3>
                    <p className="text-[11px] text-slate-400 font-mono">Herramientas críticas para mantenimiento de datos y reinicio maestro del sistema.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !cloudSyncEnabled;
                      setCloudSyncEnabled(nextVal);
                      localStorage.setItem('petromapi_cloud_sync_enabled', String(nextVal));
                    }}
                    className={`px-3.5 py-2 rounded text-[10px] font-black uppercase font-sans tracking-wider border cursor-pointer transition-all ${
                      cloudSyncEnabled
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                    }`}
                  >
                    {cloudSyncEnabled ? '🔄 Sincronización: ACTIVA (Supabase)' : '🔒 Sincronización: APAGADA (Local Seguro)'}
                  </button>
                </div>

                <div className="bg-slate-950 p-4 rounded border border-slate-850 text-xs text-slate-300 space-y-1.5 leading-relaxed">
                  <p className="font-bold text-slate-200">💡 Indicaciones de Uso sobre la Caja de Herramientas:</p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-450 text-[11px]">
                    <li><strong>Sincronización ACTIVA:</strong> Cada cambio se escribe directamente en Supabase PostgreSQL vía Realtime. Asegúrese de que las Row Level Security (RLS) policies permitan insert/update.</li>
                    <li><strong>Sincronización APAGADA:</strong> Activa el <strong>Modo Local Seguro</strong>. Todos los datos nuevos se graban en localStorage sin enviarse a la nube.</li>
                  </ul>
                </div>

                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      if (confirm('¿Seguro que desea resetear la base de datos a los valores de fábrica de Petro Mapi SAC? Se reconstruirán todos los datos locales y se subirán a Supabase.')) {
                        resetDB();
                        const initial = getDB();
                        setDb(initial);
                        
                        if (cloudSyncEnabled) {
                          syncAllData(initial)
                            .then(() => {
                              alert('Base de Datos restaurada localmente y sincronizada con Supabase exitosamente.');
                            })
                            .catch((err) => {
                              console.warn('Restore sync failed:', err);
                              setCloudSyncEnabled(false);
                              localStorage.setItem('petromapi_cloud_sync_enabled', 'false');
                              alert('La base de datos se restauró exitosamente a nivel Local, pero falló la sincronización con Supabase: ' + err.message + '\n\nSe ha activado automáticamente el Modo Local Seguro.');
                            });
                        } else {
                          alert('¡Éxito! Base de Datos restaurada a valores de fábrica localmente (Sincronización Cloud inactiva).');
                        }
                      }
                    }}
                    className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-4 py-2.5 rounded text-xs font-black uppercase tracking-wider border border-rose-500/20 hover:border-rose-500/30 transition-all cursor-pointer"
                  >
                    Restaurar Base de Datos Original (Cloud Push)
                  </button>

                  <button
                    onClick={() => {
                      syncAllData(db)
                        .then(() => {
                          alert('¡Éxito! Todos los datos locales actuales de la flota han sido subidos y guardados en Supabase.');
                          setCloudSyncEnabled(true);
                          localStorage.setItem('petromapi_cloud_sync_enabled', 'true');
                        })
                        .catch((err) => {
                          alert('Error al realizar guardado forzado en Supabase: ' + err.message + '\n\nVerifique la conexión y que las tablas existan en el esquema público de Supabase.');
                        });
                    }}
                    className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-4 py-2.5 rounded text-xs font-black uppercase tracking-wider border border-emerald-500/20 hover:border-emerald-500/30 transition-all cursor-pointer"
                  >
                    Forzar PUSH manual a Supabase
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      {/* GLOBAL PROFILE MODAL */}
      {showProfileModal && (() => {
        const isProfileEditable = currentUser?.rol === 'Administrador' || currentUser?.rol === 'Administradores (Full Acceso)';
        return (
          <div className="fixed inset-0 z-[110] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded shadow-2xl flex flex-col">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="font-sans text-sm font-black text-slate-100 uppercase tracking-wider">Mi Perfil de Usuario</h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {isProfileEditable ? "Gestione sus credenciales de acceso personales." : "Visualice sus credenciales asignadas en el sistema."}
                  </p>
                </div>
                <button 
                  onClick={() => setShowProfileModal(false)} 
                  className="text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              <form onSubmit={handleProfileSubmit} className="p-5 space-y-4 text-xs">
                {!isProfileEditable && (
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-2.5 rounded text-[10px] font-mono leading-relaxed">
                    ⚠️ MODO SOLO LECTURA: Su cuenta no cuenta con permisos de administrador para modificar credenciales. Si requiere cambiar sus datos, por favor solicítelo al Administrador del sistema.
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    disabled={!isProfileEditable}
                    value={profileNombre}
                    onChange={(e) => setProfileNombre(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-[#10b981] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Usuario (Login ID)</label>
                    <input
                      type="text"
                      required
                      disabled={!isProfileEditable}
                      value={profileUsuario}
                      onChange={(e) => setProfileUsuario(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 rounded px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-[#10b981] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Correo Electrónico</label>
                    <input
                      type="email"
                      required
                      disabled={!isProfileEditable}
                      value={profileCorreo}
                      onChange={(e) => setProfileCorreo(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-[#10b981] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Contraseña de Acceso</label>
                  <input
                    type="text"
                    required
                    disabled={!isProfileEditable}
                    value={profileContrasena}
                    onChange={(e) => setProfileContrasena(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 rounded px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-[#10b981] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Rol de Sistema (No Editable)</label>
                  <div className="w-full bg-slate-950/60 border border-slate-850 rounded px-3 py-2 text-xs text-slate-400 font-mono">
                    {currentUser?.rol}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 -mx-5 -mb-5 bg-slate-950/60 p-4">
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(false)}
                    className="px-3.5 py-1.5 uppercase text-slate-500 hover:text-slate-200 font-bold tracking-tight text-xs transition-colors"
                  >
                    {isProfileEditable ? "Cancelar" : "Cerrar"}
                  </button>
                  {isProfileEditable && (
                    <button
                      type="submit"
                      className="px-4 py-1.5 uppercase bg-primary text-slate-950 font-black rounded hover:bg-[#6ee7b7] transition-all cursor-pointer text-xs"
                    >
                      Actualizar Perfil
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export type Rol = 'superadmin' | 'admin' | 'cajero' | 'cobrador' | 'cliente';
export type Modalidad = 'frances' | 'flat' | 'gota';
export type Frecuencia = 'diario' | 'semanal' | 'quincenal' | 'mensual';

export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Cliente {
  id: number;
  nombre: string;
  cedula: string | null;
  telefono: string | null;
  direccion: string | null;
  ruta_id: number | null;
  referencia: string | null;
  estado: 'activo' | 'inactivo';
  ruta_nombre?: string | null;
}

export interface CuotaPlan {
  numero: number;
  fecha_venc: string;
  capital: number;
  interes: number;
  monto_cuota: number;
}

export interface SimulacionResponse {
  cuotas: CuotaPlan[];
  interes_total: number;
  monto_total: number;
  cuota: number;
}

export interface Prestamo {
  id: number;
  cliente_id: number;
  modalidad: Modalidad;
  monto: string;
  tasa_interes: string;
  plazo: number;
  frecuencia: Frecuencia;
  fecha_inicio: string;
  monto_total: string;
  saldo: string;
  estado: string;
  cliente_nombre?: string;
  cliente_telefono?: string | null;
}

export interface Pago {
  id: number;
  prestamo_id: number;
  monto: string;
  moneda?: string;
  tasa?: string | null;
  monto_moneda?: string | null;
  metodo: string;
  fecha: string;
  nota: string | null;
}

export interface MoraResumen {
  cuotas_vencidas: number;
  dias_atraso_max: number;
  mora_estimada: number;
  recargo_pct: number;
}

export interface Movimiento {
  id: number;
  tipo: 'ingreso' | 'egreso';
  concepto: string;
  monto: string;
  descripcion: string | null;
  fecha: string;
  usuario_nombre?: string | null;
}

export interface CajaDetalle {
  tipo: string;
  concepto: string;
  total: number;
  n: number;
}

export interface CajaResumen {
  desde: string;
  hasta: string;
  ingresos: number;
  egresos: number;
  neto: number;
  detalle: CajaDetalle[];
}

export interface Moroso {
  id: number;
  saldo: string;
  cliente: string;
  telefono: string | null;
}

export interface CarteraReporte {
  prestado: number;
  a_cobrar: number;
  cobrado: number;
  por_cobrar: number;
  ganancia_esperada: number;
  n_prestamos: number;
  activos: number;
  en_mora: number;
  pagados: number;
  morosos: Moroso[];
}

export interface NotiCuota {
  cuota_id: number;
  prestamo_id: number;
  numero: number;
  fecha_venc: string;
  monto: string;
  dias: number;
  cliente: string;
  telefono: string | null;
}

export interface Notificaciones {
  vencidas: NotiCuota[];
  por_vencer: NotiCuota[];
  resumen: { vencidas: number; por_vencer: number };
}

export interface UsuarioRow {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  telefono: string | null;
  activo: number;
}

export interface Cobrador {
  id: number;
  nombre: string;
}

export interface RutaItem {
  cuota_id: number;
  prestamo_id: number;
  numero: number;
  fecha_venc: string;
  estado: string;
  por_cobrar: string;
  monto_cuota: string;
  cliente: string;
  telefono: string | null;
  direccion: string | null;
  saldo: string;
}

export interface RutaHoy {
  data: RutaItem[];
  total_esperado: number;
  cuenta: number;
}

export interface DashboardKpis {
  por_cobrar: number;
  cobrado: number;
  cobrado_hoy: number;
  prestado: number;
  activos: number;
  en_mora: number;
  pagados: number;
  total: number;
  clientes: number;
}

export interface SerieDia {
  dia: string;
  total: string;
}

export interface PorModalidad {
  modalidad: string;
  n: number;
  saldo: string;
}

export interface DashboardData {
  kpis: DashboardKpis;
  cobros_por_dia: SerieDia[];
  por_modalidad: PorModalidad[];
  por_estado: { activo: number; mora: number; pagado: number };
}

export interface PrestamoListItem {
  id: number;
  cliente_id: number;
  cliente_nombre: string;
  modalidad: Modalidad;
  monto: string;
  monto_total: string;
  saldo: string;
  estado: string;
  fecha_inicio: string;
  frecuencia: Frecuencia;
  plazo: number;
}

export interface PortalCuota {
  id: number;
  numero: number;
  fecha_venc: string;
  monto_cuota: string;
  pagado: string;
  estado: string;
}

export interface PortalPago {
  id: number;
  monto: string;
  moneda?: string;
  tasa?: string | null;
  monto_moneda?: string | null;
  metodo: string;
  fecha: string;
}

export interface PortalPrestamo {
  id: number;
  modalidad: string;
  frecuencia: string;
  monto: string;
  monto_total: string;
  saldo: string;
  estado: string;
  fecha_inicio: string;
  cuotas: PortalCuota[];
  pagos: PortalPago[];
}

export interface MiCuenta {
  cliente: { id: number; nombre: string; cedula: string | null; telefono: string | null };
  prestamos: PortalPrestamo[];
  whatsapp_oficina: string;
}

export interface PagoReportado {
  id: number;
  cliente: string;
  cliente_id: number;
  prestamo_id: number;
  monto: string;
  moneda?: string;
  referencia: string | null;
  nota: string | null;
  comprobante: string | null;
  estado: string;
  fecha: string;
}


export interface Tasa {
  fecha: string;
  valor: string;
  fuente: string;
}


export interface MetodoPago {
  id: number;
  nombre: string;
  activo?: number;
  orden?: number;
}


export interface AuditoriaItem {
  id: number;
  usuario_nombre: string | null;
  rol: string | null;
  accion: string;
  entidad: string | null;
  entidad_id: number | null;
  detalle: string | null;
  ip: string | null;
  fecha: string;
}


export interface CierreInfo {
  fecha: string;
  ingresos: number;
  egresos: number;
  esperado: number;
  cierre: {
    contado: string;
    diferencia: string;
    nota: string | null;
    usuario_nombre: string | null;
    created_at: string;
  } | null;
}

export interface CierreRow {
  id: number;
  fecha: string;
  esperado: string;
  contado: string;
  diferencia: string;
  nota: string | null;
  usuario_nombre: string | null;
}


export interface GananciaFila {
  modalidad?: string;
  cobrador?: string;
  cobrado: number;
  interes: number;
}

export interface Ganancias {
  desde: string;
  hasta: string;
  periodo: { cobrado: number; interes: number; capital: number };
  por_modalidad: GananciaFila[];
  por_cobrador: GananciaFila[];
  esperado_vs_real: { esperado: number; real: number };
}

/* ===== SaaS / Superadmin ===== */
export interface Plan {
  id: number;
  nombre: string;
  precio: string;
  dias: number;
  max_clientes: number | null;
  max_usuarios: number | null;
  activo: number;
}

export interface Casa {
  id: number;
  nombre: string;
  estado: 'prueba' | 'activa' | 'suspendida' | 'vencida';
  estado_calc: string;
  usable: boolean;
  en_gracia: boolean;
  dias_restantes: number | null;
  fecha_vencimiento: string | null;
  contacto: string | null;
  telefono: string | null;
  dias_gracia: number;
  plan_id: number | null;
  plan_nombre: string | null;
  n_clientes: number;
  n_prestamos: number;
  n_usuarios: number;
  created_at: string;
}

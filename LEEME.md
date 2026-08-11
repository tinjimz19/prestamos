# Prestamos y Cobranzas — Guia de arranque (Fase 0)

Proyecto en dos partes:
- **Frontend (Next.js + TS + Tailwind):** `C:\prestamos`
- **Backend (API PHP + MySQL):** `C:\xampp\htdocs\prestamos-back`

---

## 1) Requisitos
- **XAMPP** con Apache y MySQL encendidos (panel de control de XAMPP → Start en ambos).
- **Node.js 18+** instalado (para el frontend). Verifica con `node -v`.

## 2) Crear la base de datos
1. Abre **phpMyAdmin**: http://localhost/phpmyadmin
2. Ve a la pestaña **SQL**.
3. Abre el archivo `C:\xampp\htdocs\prestamos-back\database\schema.sql`, copia TODO su contenido, pegalo y presiona **Continuar**.
4. Esto crea la base `prestamos_db`, todas las tablas y un usuario administrador:
   - **Email:** `admin@prestamos.local`
   - **Clave:** `admin123`

## 3) Probar el backend
En el navegador entra a:  **http://localhost/prestamos-back/ping**

Debes ver algo asi:
```json
{ "ok": true, "msg": "API Prestamos funcionando", "db": "conectada", "time": "..." }
```
Si `db` dice `conectada`, el backend y MySQL estan bien.

> Si sale error 404: en XAMPP el modulo `mod_rewrite` viene activo por defecto. Si lo desactivaste, actívalo en `httpd.conf` y reinicia Apache.

## 4) Levantar el frontend
Abre una terminal (CMD o PowerShell) en `C:\prestamos` y ejecuta:
```bash
npm install      # solo la primera vez (baja las dependencias)
npm run dev      # arranca el servidor de desarrollo
```
Luego abre:  **http://localhost:3000**

Te redirige a la pantalla de login. Entra con `admin@prestamos.local` / `admin123`.
El dashboard te mostrara el estado de la API (prueba de que front y back se comunican).

---

## Configuracion que quizas quieras cambiar
- **Clave de MySQL:** `prestamos-back/config/database.php` (por defecto usuario `root` sin clave, como XAMPP).
- **Secreto de los tokens:** `prestamos-back/config/config.php` → `JWT_SECRET` (cambialo por una cadena larga).
- **URL de la API en el front:** `prestamos/.env.local` → `NEXT_PUBLIC_API_URL`.

## Estructura creada
```
prestamos-back/           (API PHP)
  index.php               rutas de la API
  config/                 config + credenciales BD
  core/                   Router, Database, Request, Response, JWT
  middleware/             AuthMiddleware (JWT + roles)
  controllers/            AuthController, HealthController
  database/schema.sql     script de la base de datos

prestamos/                (Next.js)
  src/app/(auth)/login    pantalla de login
  src/app/(panel)/dashboard
  src/lib/api.ts          cliente HTTP hacia la API
  src/lib/auth.ts         manejo de sesion (token)
  src/types/              tipos TypeScript
```

## Que sigue (Fase 1)
Clientes + Prestamos: CRUD de clientes, calculadora de las 3 modalidades
(frances, flat, gota a gota) y creacion de prestamos con su plan de cuotas.

---

## Novedades Fase 1 (clientes + prestamos)
Ya con la app corriendo (ver pasos arriba) tienes:
- **Clientes**: menu lateral -> Clientes. Crear, buscar y ver ficha de cada cliente.
- **Nuevo prestamo**: desde la ficha del cliente (boton "+ Nuevo prestamo") o el menu.
  1. Elige modalidad (frances / flat / gota), monto, **tasa ANUAL %**, n. de cuotas, frecuencia y fecha.
  2. Presiona **Simular** para ver el plan de cuotas y el total ANTES de guardar.
  3. **Confirmar** crea el prestamo, genera las cuotas y registra el desembolso en caja.
- **Detalle del prestamo**: plan de cuotas con semaforo (verde=pagada, amarillo=parcial, rojo=vencida).

### Nota sobre la tasa
La tasa que escribes es **nominal anual** y el sistema la prorratea segun la frecuencia
(mensual /12, quincenal /24, semanal /52, diario /360). El boton Simular te muestra
los numeros exactos, asi que puedes ajustar la tasa hasta que el total sea el que quieres cobrar.

### Nuevos endpoints de la API
- `GET/POST /clientes`, `GET/PUT /clientes/{id}`
- `POST /prestamos/simular` (previsualiza sin guardar)
- `POST /prestamos`, `GET /prestamos/{id}`, `GET /prestamos/{id}/cuotas`

---

## Novedades Fase 2 (pagos / cobranzas + mora)
- **Registrar pago**: entra al detalle de un prestamo y usa el panel "Registrar pago"
  (monto, metodo, nota). El abono se aplica automaticamente a las cuotas mas antiguas
  primero, recalcula el saldo, marca las cuotas (pagada / parcial) y registra el ingreso en caja.
- **Historial de pagos**: se ve en el mismo detalle.
- **Mora**: al abrir un prestamo, las cuotas vencidas (segun los dias de gracia configurados)
  se marcan en rojo y aparece un aviso con las cuotas vencidas, dias de atraso y la mora estimada.
  La mora es **informativa** (no se suma sola al saldo).

### Ajuste de gota a gota
En **gota a gota**, la tasa que escribes es el **interes total** sobre el monto
(ej: 20% de 500 = 100, cobras 600), sin anualizar. Francés y flat siguen usando tasa anual.
El formulario cambia la etiqueta segun la modalidad.

### Parametros de mora (tabla configuracion)
- `dias_gracia` (default 2): dias despues del vencimiento antes de contar mora.
- `recargo_mora_pct` (default 2.0): % de recargo por dia para la mora estimada.
Puedes cambiarlos en phpMyAdmin -> tabla configuracion.

### Nuevos endpoints
- `POST /pagos` (registrar abono), `GET /pagos` (historial, filtros ?prestamo= y ?fecha=)
- `GET /prestamos/{id}` ahora incluye tambien los pagos y el resumen de mora.

---

## Novedades Fase 3 (caja y reportes)
- **Caja** (menu, admin/cajero): elige un rango de fechas y ve ingresos, egresos y neto,
  con la lista de movimientos (desembolsos, pagos, gastos). El admin puede **registrar gastos**.
- **Reportes** (menu, solo admin): reporte de cartera con capital prestado, total a cobrar,
  cobrado, por cobrar y ganancia esperada; contadores de prestamos (activos / en mora / pagados)
  y la **lista de morosos** con enlace directo a cada prestamo.
- La caja se llena sola: cada desembolso entra como egreso y cada pago como ingreso.
  Los reportes refrescan el estado de mora de toda la cartera antes de contar.

### Nuevos endpoints
- `GET /caja/resumen?desde=&hasta=`  y  `GET /caja/movimientos?desde=&hasta=&tipo=`
- `POST /caja/gasto` (admin)
- `GET /reportes/cartera` (admin)

---

## Novedades Fase 4 (alertas + cobrador)  [completa el MVP]
- **Alertas** (menu, admin/cajero): cuotas **vencidas** y **por vencer** (proximos 5 dias),
  con cliente, telefono, monto y dias, y enlace directo para ir a cobrar.
- **Usuarios** (menu, solo admin): lista de usuarios y formulario para **crear cobradores**
  (o cajeros/admin). Aqui creas los cobradores que luego asignas a los prestamos.
- **Cobrador**: al crear un prestamo ahora puedes asignar un **cobrador** (campo opcional).
  El cobrador, al iniciar sesion, ve **"Mi ruta de hoy"**: las cuotas que le toca cobrar
  hoy o atrasadas, con un boton de **cobro rapido** (monto sugerido = lo que falta de la cuota).
- La navegacion es por rol: el cobrador solo ve Inicio, Mi ruta y Clientes.

### Como probar el flujo del cobrador
1. Como admin, ve a **Usuarios** y crea un usuario con rol **cobrador**.
2. Crea (o abre) un prestamo y asignale ese cobrador en el formulario.
3. Cierra sesion y entra con el cobrador -> **Mi ruta de hoy** mostrara sus cobros.

### Nuevos endpoints
- `GET /notificaciones?dias=5` (admin/cajero)
- `GET /usuarios`, `POST /usuarios`, `GET /usuarios/cobradores` (admin; cobradores tambien cajero)
- `GET /ruta/hoy` (cobrador; admin puede ver la de un cobrador con ?cobrador=ID)

**Con esto quedan cubiertas las 4 areas del MVP:** clientes+prestamos, pagos, caja+reportes y alertas.
Lo que sigue es opcional (Fase 5): portal del cliente en modo solo lectura.

---

## Rediseño (tema claro/oscuro + movil)
- **Tema claro/oscuro**: boton de sol/luna arriba (en el menu y en el login). Recuerda tu eleccion
  y respeta el tema del sistema la primera vez. Sin parpadeo al cargar.
- **Paleta profesional**: color de marca indigo, con verde/ambar/rojo para exito/alerta/error.
  Todo usa tokens de color que cambian solos con el tema (no hay colores fijos).
- **Transiciones suaves** en cambios de tema, hover y el menu movil.
- **Vista movil**: en celular aparece una barra superior con menu hamburguesa y un panel lateral
  deslizante. En escritorio, el menu lateral fijo de siempre. Todas las pantallas son responsivas.

No hay dependencias nuevas: con `npm run dev` corriendo, al guardar los cambios Tailwind recompila solo.
Si acaso, detén y vuelve a arrancar `npm run dev` para recargar la config de Tailwind.

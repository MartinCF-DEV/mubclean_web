# Mubclean Web Application - Documentación del Proyecto

Este documento describe la arquitectura, estructura y comandos principales para el desarrollo del ecosistema completo de la aplicación web Mubclean, tanto para el Frontend (Aplicación Cliente/Admin) como para el Backend (API y Pasarela de Pagos).

---

## 1. Frontend (Angular)

- **Framework:** Angular (v21.1+)
- **Lenguaje:** TypeScript
- **BaaS (Backend as a Service):** @supabase/supabase-js (Base de datos PostgreSQL y Autenticación)
- **Notificaciones y UI:** Toast Service (Implementación propia)
- **UI/UX:** Tailwind CSS, Angular Material (iconos), animaciones fluidas con AOS (Animate On Scroll)
- **Manejo de Estado:** RxJS y Services
- **Enrutamiento:** RouterModule integrado en `app.routes.ts`

---

## 2. Organización de Directorios (Frontend)

El código de la aplicación reside en `mubclean-frontend/src/app/`, el cual adopta una organización basada en rutas y componentes por cada módulo.

```text
src/app/
├── admin-dashboard/            # Panel de control del administrador del negocio
├── admin-employees/            # Gestión de técnicos/empleados
├── admin-incidents/            # Gestión de soporte y quejas
├── admin-layout/               # Plantilla y navegación principal del panel Admin
├── admin-license/              # Módulo de pago y gestión de licencias del negocio
├── admin-payment-callback/     # Callback de Mercado Pago para membresías
├── admin-requests/             # Gestión de solicitudes de los clientes
├── admin-tech-tracking/        # Seguimiento en tiempo real y agenda de técnicos (Tracker)
├── customer-*/                 # Vistas del cliente (dashboard, historial, detalle de servicio, soporte)
├── customer-payment-callback/  # Callback de Mercado Pago para pagos de servicios del cliente
├── landing-page/               # Página pública de inicio y marketing de Mubclean
├── login/ & register/          # Módulos de autenticación y reinicio de contraseña
├── toast/                      # Sistema de notificaciones emergentes
├── app.component.html/.ts/.css # Componente raíz
└── app.routes.ts & app.config.ts # Configuración global y mapas de rutas
```

Directorios complementarios en la raíz de `src/`:
- `src/assets/`: Recursos estáticos.
- Archivos estáticos de estilo (como `styles.css`).

---

## 3. Backend (Node.js & Express)

El ecosistema de backend se encuentra en la carpeta `mubclean-backend/`. Aquí residen los servicios de pagos con integradores externos e interacción directa con la base de datos de manera segura.

- **Entorno:** Node.js (>= 18)
- **Framework:** Express
- **Pasarela de Pagos:** Mercado Pago API (`mercadopago`)
- **Base de Datos y Auth:** PostgreSQL a través de Supabase (`@supabase/supabase-js`)
- **Middlewares:** `cors` y `dotenv` (para variables de entorno)
- **Watchers:** `nodemon` (para desarrollo local ininterrumpido)

La lógica y el diseño de la API se localizan concentrados de forma modular en `mubclean-backend/src/server.js`.

---

## 4. Endpoints y Comandos (Backend)

La API expone prefijos `/api/` para interactuar con el Frontend. A continuación el mapeo:

### Salud (Healthcheck)
- `GET /` - Verifica que el proceso principal de Backend responda.
- `GET /api/health` - Retorna el timestamp de latencia y estado de salud.

### Pagos (Mercado Pago API)
- `POST /api/create_preference` - Crea una preferencia de pago para un checkout de cliente por un servicio.
- `POST /api/create_license_preference` - Crea la preferencia para procesar la membresía de un Negocio a la plataforma de Mubclean.
- `POST /api/claim_license_payment` - Activación en Supabase tras recibir notificación de cobro (o periódo de prueba) exitosa.
- `POST /api/confirm_license_payment` - Verificación final y actualización de fecha de expiración para `negocios`.

### Soporte (Incidentes y Casos)
- `GET /api/incidents?negocioId=...` - Obtiene todo el backlog de quejas/tickets para un negocio.
- `POST /api/incidents` - Crea un ticket de atención vinculado a un usuario/negocio/servicio determinado.
- `PATCH /api/incidents/:id` - Actualiza el estado (`estado`) de la atención de incidente (abierto/cerrado/etc).

### Comandos de Ejecución y Scripts

**Despliegue de Frontend (en terminal /mubclean-frontend):**
```bash
npm install     # Instalar node_modules
npm run start   # Iniciar el CLI de Angular (ng serve) localhost:4200
```

**Despliegue de Backend (en terminal /mubclean-backend):**
```bash
npm install     # Instalar las librerías necesarias del servidor
npm run dev     # Iniciar servidor en modo de escucha continua para desarrollo
npm run start   # Iniciar el servidor estándar (Node + Express)
```

--
> **Nota de Variables de Entorno (Backend)**:
> Para ejecutar el backend se requiere un `.env` válido con atributos como `PORT`, `SUPABASE_URL`, `SUPABASE_KEY`, `FRONTEND_URL`, y el `MP_ACCESS_TOKEN` de Sandbox/Producción.

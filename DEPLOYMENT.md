# Guía de Despliegue - Mubclean en Render

Esta guía te llevará paso a paso para desplegar la aplicación Mubclean (backend + frontend) en Render.com.

## 📋 Prerequisitos

- [ ] Cuenta en [GitHub](https://github.com)
- [ ] Cuenta en [Render](https://render.com)
- [ ] Cuenta en [Supabase](https://supabase.com) (ya configurada)
- [ ] Cuenta en [MercadoPago](https://www.mercadopago.com.mx/developers) con Access Token

## 🚀 Paso 1: Subir Código a GitHub

### 1.1 Inicializar Git (si no está inicializado)

```bash
cd mubclean_Web
git init
```

### 1.2 Agregar archivos al repositorio

```bash
git add .
git commit -m "Initial commit - Mubclean Web Application"
```

### 1.3 Crear repositorio en GitHub

1. Ve a [GitHub](https://github.com/new)
2. Crea un nuevo repositorio (por ejemplo: `mubclean-web`)
3. **NO** inicialices con README, .gitignore o licencia (ya los tienes)

### 1.4 Conectar y subir código

```bash
git remote add origin https://github.com/TU_USUARIO/mubclean-web.git
git branch -M main
git push -u origin main
```

> [!TIP]
> Si tienes problemas de autenticación, usa un [Personal Access Token](https://github.com/settings/tokens) en lugar de tu contraseña.

## 🔧 Paso 2: Desplegar Backend en Render

### 2.1 Crear Web Service

1. Ve a [Render Dashboard](https://dashboard.render.com/)
2. Click en **"New +"** → **"Web Service"**
3. Conecta tu repositorio de GitHub
4. Selecciona el repositorio `mubclean-web`

### 2.2 Configurar el servicio

| Campo | Valor |
|-------|-------|
| **Name** | `mubclean-backend` |
| **Region** | Selecciona la más cercana (ej: Oregon) |
| **Branch** | `main` |
| **Root Directory** | `mubclean-backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Free (o el que prefieras) |

### 2.3 Configurar Variables de Entorno

En la sección **"Environment Variables"**, agrega:

| Key | Value |
|-----|-------|
| `PORT` | `3000` |
| `SUPABASE_URL` | `https://wtlitcaiboefcujqrmrg.supabase.co` |
| `SUPABASE_KEY` | Tu Supabase anon key |
| `MP_ACCESS_TOKEN` | Tu MercadoPago Access Token |
| `FRONTEND_URL` | `https://tu-frontend.onrender.com` (lo configurarás después) |

> [!IMPORTANT]
> Guarda la URL de tu backend (ej: `https://mubclean-backend.onrender.com`). La necesitarás para el frontend.

### 2.4 Desplegar

Click en **"Create Web Service"**. Render comenzará a construir y desplegar tu backend.

## 🎨 Paso 3: Desplegar Frontend en Render

### 3.1 Crear Static Site

1. En Render Dashboard, click **"New +"** → **"Static Site"**
2. Selecciona el mismo repositorio `mubclean-web`

### 3.2 Configurar el sitio

| Campo | Valor |
|-------|-------|
| **Name** | `mubclean-frontend` |
| **Branch** | `main` |
| **Root Directory** | `mubclean-frontend` |
| **Build Command** | `npm install && npm run build:prod` |
| **Publish Directory** | `dist/mubclean-frontend/browser` |

### 3.3 Configurar Rewrites (Opcional)

Render detectará automáticamente `serve.json` para manejar rutas SPA. Si no funciona:

1. Ve a **"Redirects/Rewrites"**
2. Agrega:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: `Rewrite`

### 3.4 Configurar Proxy para API

> [!WARNING]
> El proxy de desarrollo (`proxy.conf.json`) **NO funciona** en producción. Tienes dos opciones:

#### Opción A: Usar Render como Proxy (Recomendado)

1. En la configuración del Static Site, agrega en **"Redirects/Rewrites"**:
   - **Source**: `/api/*`
   - **Destination**: `https://mubclean-backend.onrender.com/api/:splat`
   - **Action**: `Rewrite`

#### Opción B: Actualizar código del frontend

Modifica los servicios Angular para usar la URL completa del backend:

```typescript
// En tus servicios
const backendUrl = 'https://mubclean-backend.onrender.com';
```

### 3.5 Desplegar

Click en **"Create Static Site"**. Render construirá y desplegará tu frontend.

## 🔄 Paso 4: Actualizar Variables de Entorno

### 4.1 Actualizar FRONTEND_URL en Backend

1. Ve a tu servicio backend en Render
2. En **"Environment"**, actualiza `FRONTEND_URL` con la URL de tu frontend (ej: `https://mubclean-frontend.onrender.com`)
3. Guarda los cambios (el servicio se redesplegará automáticamente)

### 4.2 Actualizar URLs de MercadoPago

Las URLs de callback ahora usarán automáticamente `FRONTEND_URL`, así que deberían funcionar correctamente.

## ✅ Paso 5: Verificar Despliegue

### 5.1 Verificar Backend

1. Abre `https://tu-backend.onrender.com`
2. Deberías ver: "Mubclean Backend is running!"
3. Prueba el health check: `https://tu-backend.onrender.com/api/health`

### 5.2 Verificar Frontend

1. Abre `https://tu-frontend.onrender.com`
2. La aplicación Angular debería cargar correctamente
3. Prueba el login y navegación

### 5.3 Verificar Conexión Backend-Frontend

1. Intenta crear una solicitud de servicio
2. Verifica que la integración con MercadoPago funcione
3. Revisa los logs en Render si hay errores

## 🔧 Configuración Adicional

### Dominios Personalizados

1. En cada servicio de Render, ve a **"Settings"** → **"Custom Domains"**
2. Agrega tu dominio personalizado
3. Configura los registros DNS según las instrucciones de Render

### Variables de Entorno de Producción

Si quieres usar diferentes credenciales de Supabase para producción:

1. Crea un nuevo proyecto en Supabase para producción
2. Actualiza `SUPABASE_URL` y `SUPABASE_KEY` en el backend
3. Actualiza `environment.prod.ts` en el frontend y redespliega

### Auto-Deploy

Render está configurado para auto-desplegar cuando haces push a `main`:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

## 🐛 Troubleshooting

### Backend no inicia

- **Revisa los logs** en Render Dashboard
- Verifica que todas las variables de entorno estén configuradas
- Asegúrate de que `package.json` tenga el campo `engines`

### Frontend muestra página en blanco

- Verifica que `serve.json` esté en el repositorio
- Revisa la consola del navegador para errores
- Asegúrate de que `dist/mubclean-frontend/browser` sea el directorio correcto

### Error de CORS

- Verifica que `FRONTEND_URL` en el backend coincida con la URL real del frontend
- Considera agregar configuración CORS específica en `server.js`:

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

### API calls fallan (404)

- Verifica que el proxy/rewrite esté configurado correctamente
- Revisa que el backend esté accesible
- Comprueba los logs del backend para ver si las peticiones llegan

### Servicio en "Suspended" (Free tier)

Los servicios gratuitos de Render se suspenden después de 15 minutos de inactividad:
- El primer request puede tardar 30-60 segundos en "despertar"
- Considera actualizar a un plan de pago para servicios críticos

## 📊 Monitoreo

### Logs en Render

1. Ve a tu servicio en Render Dashboard
2. Click en **"Logs"** para ver logs en tiempo real
3. Usa los logs para debugging y monitoreo

### Métricas

Render proporciona métricas básicas:
- CPU usage
- Memory usage
- Request count

## 🔐 Seguridad

> [!CAUTION]
> **Antes de ir a producción**:

1. **Habilita Row Level Security (RLS)** en Supabase
2. **Configura políticas de seguridad** en las tablas de Supabase
3. **Usa HTTPS** para todas las comunicaciones (Render lo proporciona automáticamente)
4. **Rota tus tokens** de MercadoPago y Supabase regularmente
5. **No compartas** tus variables de entorno públicamente

## 📚 Recursos Adicionales

- [Render Documentation](https://render.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [MercadoPago API Reference](https://www.mercadopago.com.mx/developers/es/reference)
- [Angular Deployment Guide](https://angular.dev/tools/cli/deployment)

## 🎉 ¡Listo!

Tu aplicación Mubclean ahora está desplegada en Render. Comparte las URLs con tu equipo y usuarios.

**URLs de ejemplo**:
- Frontend: `https://mubclean-frontend.onrender.com`
- Backend API: `https://mubclean-backend.onrender.com`

---

**¿Problemas?** Revisa los logs en Render Dashboard o consulta la sección de Troubleshooting.

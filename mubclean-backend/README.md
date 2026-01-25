# Mubclean Backend API

API REST desarrollada con Node.js y Express para la aplicación Mubclean. Proporciona endpoints para integración con Supabase (base de datos) y MercadoPago (procesamiento de pagos).

## 🚀 Tecnologías

- **Node.js** 18+
- **Express** 5.x - Framework web
- **Supabase Client** - Cliente de base de datos PostgreSQL
- **MercadoPago SDK** - Procesamiento de pagos
- **CORS** - Habilitado para comunicación con frontend
- **dotenv** - Gestión de variables de entorno

## 📋 Prerequisitos

- Node.js >= 18.0.0
- npm >= 9.0.0
- Cuenta en Supabase
- Cuenta en MercadoPago (Access Token)

## 🔧 Instalación

1. **Instalar dependencias**
```bash
npm install
```

2. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:
```env
PORT=3000
SUPABASE_URL=tu_supabase_url
SUPABASE_KEY=tu_supabase_anon_key
MP_ACCESS_TOKEN=tu_mercadopago_access_token
FRONTEND_URL=http://localhost:4200
```

3. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

4. **Iniciar servidor de producción**
```bash
npm start
```

## 📡 Endpoints

### Health Check
```
GET /
GET /api/health
```
Verifica que el servidor esté funcionando correctamente.

**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-25T12:00:00.000Z"
}
```

### Crear Preferencia de Pago
```
POST /api/create_preference
```

Crea una preferencia de pago en MercadoPago para procesar transacciones.

**Body:**
```json
{
  "items": [
    {
      "title": "Servicio de Limpieza",
      "description": "Limpieza profunda",
      "quantity": 1,
      "unit_price": 500.00,
      "currency_id": "MXN"
    }
  ],
  "solicitudId": "12345"
}
```

**Respuesta:**
```json
{
  "init_point": "https://www.mercadopago.com.mx/checkout/v1/redirect?pref_id=..."
}
```

## 🌍 Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `3000` |
| `SUPABASE_URL` | URL de tu proyecto Supabase | `https://xxx.supabase.co` |
| `SUPABASE_KEY` | Anon/Public key de Supabase | `eyJhbGc...` |
| `MP_ACCESS_TOKEN` | Access Token de MercadoPago | `APP_USR-...` |
| `FRONTEND_URL` | URL del frontend (para callbacks) | `http://localhost:4200` |

## 🚀 Despliegue en Render

1. **Crear Web Service en Render**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node

2. **Configurar Variables de Entorno**
   - Agregar todas las variables listadas arriba en la configuración del servicio

3. **Conectar con Frontend**
   - Actualizar `FRONTEND_URL` con la URL de tu frontend en producción
   - Configurar CORS si es necesario

## 📝 Scripts Disponibles

- `npm start` - Inicia el servidor en modo producción
- `npm run dev` - Inicia el servidor con nodemon (auto-reload)
- `npm test` - Ejecuta tests (no implementado)

## 🔒 Seguridad

- Las credenciales sensibles NUNCA deben estar en el código
- Usa variables de entorno para todas las configuraciones
- El archivo `.env` está en `.gitignore` y no se sube a Git
- CORS está habilitado - configura orígenes permitidos en producción

## 🐛 Troubleshooting

### Error: "Cannot find module 'dotenv'"
```bash
npm install
```

### Error: "SUPABASE_URL is undefined"
Verifica que el archivo `.env` exista y contenga las variables correctas.

### Error de CORS
Verifica que `FRONTEND_URL` esté configurado correctamente y que el frontend use la URL correcta del backend.

## 📚 Recursos

- [Express Documentation](https://expressjs.com/)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [MercadoPago SDK](https://www.mercadopago.com.mx/developers/es/docs)

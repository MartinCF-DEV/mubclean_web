# Mubclean Web Application

Aplicación web de Mubclean que consiste en un backend Node.js/Express y un frontend Angular para gestión de servicios de limpieza.

## 📁 Estructura del Proyecto

```
mubclean_Web/
├── mubclean-backend/     # API REST con Node.js + Express
├── mubclean-frontend/    # Aplicación Angular
├── DEPLOYMENT.md         # Guía de despliegue en Render
└── README.md            # Este archivo
```

## 🚀 Inicio Rápido

### Prerequisitos

- Node.js 18.x o superior
- npm 9.x o superior
- Cuenta en Supabase (base de datos)
- Cuenta en MercadoPago (pagos)

### Instalación Local

1. **Clonar el repositorio**
```bash
git clone <tu-repositorio-url>
cd mubclean_Web
```

2. **Configurar Backend**
```bash
cd mubclean-backend
npm install
cp .env.example .env
# Editar .env con tus credenciales
npm run dev
```

3. **Configurar Frontend** (en otra terminal)
```bash
cd mubclean-frontend
npm install
npm start
```

4. **Acceder a la aplicación**
- Frontend: http://localhost:4200
- Backend API: http://localhost:3000

## 🔧 Variables de Entorno

### Backend (`mubclean-backend/.env`)
```
PORT=3000
SUPABASE_URL=tu_supabase_url
SUPABASE_KEY=tu_supabase_anon_key
MP_ACCESS_TOKEN=tu_mercadopago_access_token
FRONTEND_URL=http://localhost:4200
```

### Frontend
Las variables de entorno del frontend se configuran en `src/environments/environment.ts` (desarrollo) y `src/environments/environment.prod.ts` (producción).

## 📦 Tecnologías

### Backend
- Node.js + Express
- Supabase (Base de datos PostgreSQL)
- MercadoPago SDK (Procesamiento de pagos)
- CORS habilitado

### Frontend
- Angular 21
- TypeScript
- Supabase Client
- RxJS

## 🌐 Despliegue

Para instrucciones detalladas de despliegue en Render, consulta [DEPLOYMENT.md](./DEPLOYMENT.md).

### Resumen de Despliegue

1. Subir código a GitHub
2. Crear dos servicios en Render:
   - **Backend**: Web Service (Node.js)
   - **Frontend**: Static Site (Angular)
3. Configurar variables de entorno en cada servicio
4. Conectar servicios y verificar funcionamiento

## 📚 Documentación Adicional

- [Backend README](./mubclean-backend/README.md) - Documentación de la API
- [Frontend README](./mubclean-frontend/README.md) - Documentación del frontend
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guía completa de despliegue

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y confidencial.

## 👥 Soporte

Para soporte, contacta al equipo de desarrollo de Mubclean.

# Mubclean Frontend

Aplicación web frontend desarrollada con Angular para la plataforma Mubclean.

## 🚀 Inicio Rápido

```bash
npm install
npm start
```

La aplicación estará disponible en `http://localhost:4200`

## 📦 Build de Producción

```bash
npm run build:prod
```

Los archivos compilados estarán en `dist/mubclean-frontend/`

## 🌍 Configuración

### Entornos
- **Desarrollo**: `src/environments/environment.ts`
- **Producción**: `src/environments/environment.prod.ts`

### Proxy API
El archivo `proxy.conf.json` redirige `/api` a `http://localhost:3000` en desarrollo.

## 🚀 Despliegue en Render

**Build Command**: `npm install && npm run build:prod`  
**Publish Directory**: `dist/mubclean-frontend/browser`

El archivo `serve.json` maneja las rutas SPA automáticamente.

## 📝 Scripts

- `npm start` - Servidor de desarrollo
- `npm run build:prod` - Build de producción
- `npm run build` - Build de desarrollo
- `npm test` - Ejecutar tests

## 📚 Documentación Completa

Para más información, consulta el [README principal](../README.md) y [DEPLOYMENT.md](../DEPLOYMENT.md).

---

**Tecnologías**: Angular 21 • TypeScript • Supabase • RxJS

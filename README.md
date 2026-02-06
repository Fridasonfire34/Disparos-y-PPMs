# Disparos y PPMs

Monorepo de una sola aplicacion Next.js que integra dos modulos:

- **Visor de Disparos**: Tablas interactivas para seguimiento de envios.
- **PPMs Internos**: Reportes de reordenes, Pareto y cargas de Excel.

## Rutas

- **/**: Visor de Disparos
- **/ppms**: PPMs Internos

## Funcionalidades clave

### Visor de Disparos

- **M Actualizado / M Enviados**
- **Viper Actualizado / Viper Enviado**
- **Boa Actualizado / Boa Enviado**
- **Junta 7 AM** con headers agrupados, filtros y edicion controlada.

### PPMs Internos

- Pareto semanal por modulo
- Reporte anual y grafica
- Carga de Excel y guardado de reordenes
- Descarga de Excel por semana

## Configuracion

Crea un archivo `.env.local` con las credenciales de SQL Server para los endpoints de PPMs:

```
DB_SERVER=
DB_PORT=1433
DB_USER=
DB_PASSWORD=
DB_NAME=
```

## Scripts

```
yarn dev
yarn build
yarn start
yarn lint
```

## Notas

- Los assets de PPMs viven en `public/PPMs`.
- Los endpoints de PPMs viven en `pages/api`.

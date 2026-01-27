This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Visor de Disparos

Sistema de gestión y visualización de disparos con tablas interactivas para seguimiento de envíos.

## Características

### Tablas Principales

- **M Actualizado / M Enviados**: Visualización de disparos M
- **Viper Actualizado / Viper Enviado**: Gestión de envíos Viper
- **Boa Actualizado / Boa Enviado**: Control de envíos Boa

### Tabla Junta 7 AM

Tabla especial con headers agrupados y funcionalidades avanzadas:

#### Headers Agrupados

- **TRAVELER COIL** (color azul claro): Incluye ETA, Status y Fecha Embarque
- **TRAVELER LINEA** (color rosa): Incluye ETA, Status y Fecha Embarque
- **TRAVELER SUBA-ESTACION 01** (color rojo): Incluye ETA, Status y Fecha Embarque

#### Funcionalidades

- **Columnas editables**: ETA y Status son editables hasta que Fecha Embarque = "ENVIADO"
- **Columnas no editables**: Secuencia y todas las Fecha Embarque
- **Código de colores**:
  - Verde: Cuando Fecha Embarque = "ENVIADO"
  - Fila completa verde: Cuando las 3 Fecha Embarque = "ENVIADO"
- **Filtros**: Disponibles en todas las columnas excepto Fecha Embarque
- **Botón Guardar**: Para persistir los cambios realizados

### Tablas de Envíos

- **Tabla de Envios Viper**: Gestión de envíos Viper
- **Tabla de Envios BOA**: Gestión de envíos BOA

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

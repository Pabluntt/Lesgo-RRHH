# Lesgo RRHH

Base de una plataforma de recursos humanos con frontend en React y backend en NestJS. El proyecto está organizado como un monorepo de npm y puede ejecutarse localmente o con Docker Compose.

## Tecnologías

- **Frontend:** React, TypeScript, Vite, Tailwind CSS y CSS.
- **Backend:** NestJS y TypeScript.
- **Contenedores:** Docker y Docker Compose.

## Requisitos

Para desarrollo local:

- Node.js 22 o posterior.
- npm.

Para ejecutar con contenedores:

- Docker Engine o Docker Desktop con Docker Compose.

## Desarrollo local

Instala las dependencias desde la raíz:

```bash
npm install
```

Inicia frontend y backend en paralelo:

```bash
npm run dev
```

Direcciones locales:

- Frontend (Vite): <http://localhost:5173>
- Backend (NestJS): <http://localhost:3000>
- Endpoint de estado: <http://localhost:3000/>

También puedes iniciar cada aplicación por separado:

```bash
npm run dev:frontend
npm run dev:backend
```

## Docker Compose

Construye las imágenes e inicia los contenedores:

```bash
docker compose up --build
```

Direcciones con Docker:

- Frontend (Nginx): <http://localhost:8080>
- Backend (NestJS): <http://localhost:3000>
- Endpoint de estado: <http://localhost:3000/>

Para iniciar en segundo plano, añade `-d`:

```bash
docker compose up --build -d
```

Para detener y eliminar los contenedores y la red:

```bash
docker compose down
```

## Estructura

```text
.
├── backend/
│   ├── src/                 # Aplicación NestJS
│   └── Dockerfile
├── frontend/
│   ├── src/                 # Aplicación React
│   ├── Dockerfile
│   └── nginx.conf           # Configuración de Nginx
├── docker-compose.yml
├── package.json             # Workspaces y comandos de raíz
└── package-lock.json
```

## Compilación

Compila ambas aplicaciones para producción:

```bash
npm run build
```

# Lesgo RRHH

Base de una plataforma de recursos humanos con frontend en React y backend en NestJS. El proyecto está organizado como un monorepo de npm y puede ejecutarse localmente o con Docker Compose.

## Tecnologías

- **Frontend:** React, TypeScript, Vite, Tailwind CSS y CSS.
- **Backend:** NestJS y TypeScript.
- **Contenedores:** Docker y Docker Compose.
- **Autenticación demo:** bcryptjs y JWT.

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

### Acceso de demostración

- Usuario: `admin`
- Contraseña: `admin123`

El login compara la contraseña con un hash bcrypt y entrega un JWT. El usuario de prueba representa la entidad **usuario del ERP**, enlazada al empleado de RRHH con ID `1`. Es una identidad simulada en memoria; no se crea una tabla de usuario duplicada en este módulo.

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

El secreto JWT se puede configurar mediante `JWT_SECRET` en el entorno o en un archivo `.env` basado en `.env.example`. El valor predeterminado de Compose es solo para desarrollo local.

## Funcionalidades demo

- **Plantilla:** empleados de ejemplo agrupados por rol, con cargo, departamento y estado.
- **Licencias y vacaciones:** solicitudes de ejemplo con aprobación/rechazo. Las aprobaciones se reflejan como ausencia cuando su rango incluye la fecha actual.
- **Contratos:** vigencias y alertas a 30 días. Se permite renovar o terminar anticipadamente. Un chequeo en memoria cada minuto finaliza contratos que superaron un mes completo desde su fecha de término sin renovación; el panel también ejecuta el chequeo al consultar los datos.
- **Mi Cuenta:** usuario ERP de ejemplo asociado a un empleado y actividad reciente.
- **Auditoría (`log`):** acciones de revisión de solicitudes y gestión de contratos, con usuario ERP, empleado asociado, acción y fecha/hora.
- **Desvinculaciones:** vista inicial; el MER todavía no define la entidad necesaria para persistir esos procesos.

Los empleados, usuarios, contratos, solicitudes y logs viven en memoria. Se reinician cuando se reinicia el backend y no son almacenamiento persistente. La autenticación es un adaptador local de demostración: al integrar el ERP real habrá que sustituir el usuario sembrado por la validación de su identidad/token, manteniendo el vínculo `usuario` → `empleado` para los logs.

### API inicial

- `POST /auth/login`: recibe `{ "username": "admin", "password": "admin123" }` y devuelve `accessToken` y usuario.
- `GET /hr/dashboard`: devuelve empleados, solicitudes, contratos, logs y cuenta. Requiere `Authorization: Bearer <token>`.
- `POST /hr/requests/:id/decision`: aprueba o rechaza una solicitud.
- `POST /hr/contracts/:id/renew`: renueva un contrato por un año.
- `POST /hr/contracts/:id/terminate`: termina anticipadamente un contrato.

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

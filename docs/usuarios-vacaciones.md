# Usuarios y vacaciones: integración provisional

## Persistencia en PostgreSQL (Neon)

El backend se conecta con `pg` usando `PGHOST`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` y
`PGSSLMODE` desde `backend/.env` (ignorado por git; plantilla en `backend/.env.example`).
Docker Compose carga ese mismo archivo. Las consultas viven en `backend/src/hr/hr.repository.ts`.

Persisten en el esquema `rrhh`:
- **Alta de usuario:** en una transacción se insertan `empleado` (con `fecha_ingreso = CURRENT_DATE`),
  `empleado_rol`, `usuario` (hash bcrypt) y un registro en `auditoria`. El catálogo de roles se lee de `rol`.
- **Login:** como indica el esquema, las cuentas de BD inician sesión con el **correo** de `empleado`.
  Se actualizan `ultimo_login` e `intentos_fallidos`; solo entran cuentas con `estado = 'activo'`.
  El usuario `admin` / `admin123` sigue siendo de demostración en memoria.
- **Perfil inicial:** teléfono, dirección y fecha de nacimiento se guardan en `empleado`. El perfil
  se considera completo cuando esos campos y el correo tienen valor (el esquema no tiene un indicador propio).
- **Solicitud de vacaciones** de un usuario de BD: se inserta en `solicitud_ausencia` con el tipo
  `Vacaciones` y estado `pendiente`, más su registro en `auditoria`. Saldo y superposición se validan
  contra la BD dentro de la transacción.

Sigue mockeado: plantilla, contratos, licencias, aprobación/rechazo de solicitudes y la actividad de
"Mi Cuenta". Por eso las solicitudes guardadas en BD aún no aparecen en el panel de aprobación del admin demo.

## Relación con el modelo SQL

Se revisaron `sql/01_create_rrhh_schema.sql`, `02_test.sql` y `03_usuario.sql`.
El alta crea un empleado y una cuenta vinculada 1:1. El identificador de cuenta coincide
con `id_empleado`, como en `usuario`. La contraseña se guarda como hash bcrypt.
Los diez roles del selector proceden del catálogo de `02_test.sql`; la asignación
representa `empleado_rol`. En esta demo se asigna un único rol por cuenta.

El formulario requiere nombre de usuario, contraseña, nombre y apellido del empleado, RUT y rol.
El RUT se normaliza y valida con módulo 11; usuario y RUT son únicos. Un RUT ya
registrado se rechaza: este flujo crea un empleado nuevo, no reasigna cuentas existentes.
El primer inicio exige fecha de nacimiento, correo, teléfono y dirección. El apellido
se guarda al crear el usuario y no se solicita ni modifica durante este paso.
Cargo y departamento quedan por asignar por RRHH; no los elige el empleado.

El SQL actual necesita ampliaciones antes de persistir este flujo:
- `usuario.nombre_usuario` único (no existe en `03_usuario.sql`).
- Indicador `perfil_completo` o equivalente; no confundir con `debe_cambiar_clave`.
- `fecha_ingreso` debe definirse administrativamente al integrar persistencia.
- Saldo/registro de movimientos de vacaciones y calendario de feriados.

## Vacaciones

El botón de Vacaciones abre un diálogo con búsqueda por nombre y RUT, selección
del empleado y fechas. La API vuelve a validar todo, sin confiar en el cálculo del navegador.
Se rechazan fechas inválidas, inicio pasado, rangos invertidos o mayores de 366 días,
rangos sin días hábiles, solicitudes superpuestas y saldo insuficiente.

**Supuestos de demostración:** cada empleado recibe 15 días iniciales, sin devengo ni
reinicio anual. Se cuentan lunes a viernes, inclusive; todavía no se descuentan feriados.
Las solicitudes pendientes reservan saldo; aprobar no vuelve a descontarlo y rechazar
libera la reserva. Las aprobadas conservan el consumo incluso después de su fecha final.
El saldo del panel se calcula desde los datos en memoria y se refresca al enviar una solicitud.

## Permisos y auditoría

Administrador y Jefe RRHH pueden crear cuentas, solicitar vacaciones para otros empleados
y resolver solicitudes/contratos. Los demás roles ven sus propios datos y pueden solicitar
sus vacaciones después de completar el perfil. Esta política es provisional para el ERP.
La API comprueba estos permisos aunque se invoque directamente. Alta, perfil y solicitud
generan logs con actor autenticado, fecha/hora y empleado afectado en el detalle.

Endpoints autenticados: `POST /hr/users`, `POST /hr/profile`, `POST /hr/vacations`.
`GET /hr/dashboard` devuelve catálogo de roles, perfil y saldo disponible.

Las cuentas, perfiles y solicitudes de usuarios de BD sobreviven a reinicios; el resto de datos
de demostración se reinicia con el backend.

**Pendiente:** `backend/test/workflows.cjs` corresponde al flujo en memoria (alta con nombre de usuario)
y debe adaptarse; ahora escribiría en la BD compartida.

# Usuarios y vacaciones: integración provisional

## Relación con el modelo SQL

Se revisaron `sql/01_create_rrhh_schema.sql`, `02_test.sql` y `03_usuario.sql`.
El alta crea un empleado y una cuenta vinculada 1:1. El identificador de cuenta coincide
con `id_empleado`, como en `usuario`. La contraseña se guarda como hash bcrypt.
Los diez roles del selector proceden del catálogo de `02_test.sql`; la asignación
representa `empleado_rol`. En esta demo se asigna un único rol por cuenta.

El formulario requiere nombre de usuario, contraseña, nombre del empleado, RUT y rol.
El RUT se normaliza y valida con módulo 11; usuario y RUT son únicos. Un RUT ya
registrado se rechaza: este flujo crea un empleado nuevo, no reasigna cuentas existentes.
El primer inicio exige apellido, fecha de nacimiento, correo, teléfono y dirección.
Cargo y departamento quedan por asignar por RRHH; no los elige el empleado.

El SQL actual necesita ampliaciones antes de persistir este flujo:
- `usuario.nombre_usuario` único (no existe en `03_usuario.sql`).
- Indicador `perfil_completo` o equivalente; no confundir con `debe_cambiar_clave`.
- Resolver el apellido obligatorio del empleado al crear una ficha provisional.
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

**No hay BD:** cuentas, perfiles, saldos y solicitudes se pierden al reiniciar el backend.
Para verificar los flujos desde la raíz: `npm run build` y
`node --test backend/test/workflows.cjs` (utiliza temporalmente el puerto 3109).

# Jerarquía de Roles - Módulo RRHH

## Roles y Permisos

### 1) Jefe(a) de RRHH
**Descripción:** Responsable del área. Tiene control total sobre lo operativo
# PR# Jerarquía de Roles - Módulo RRHH

## Roles y Permisos

### 1) Jefe(a) de RRHH
**Descripción:** Responsable del área. Tiene control total sobre lo operativo del módulo RRHH.

| **Puede hacer** | **No puede hacer** |
|---|---|
| **Empleados:** Ver, crear, editar and do de baja empleados. | **Auditoría:** Modificar o eliminar registros de la tabla `auditoria`. |
| **Contratos:** Crear, editar, renovar o finalizar contratos. | **Roles globales:** Otorgar el rol `Administrador` a otros usuarios. |
| **Solicitudes de ausencia:** Aprobar, rechazar, cancelar or give seguimiento to any solicitud. | **Otros módulos:** Acceder a módulos fuera de RRHH (Compras, Ventas, etc). |
| **Horas extra:** Autorizar and aprobar el canje de horas extra. | **Historial crítico:** Borrar contratos, empleados or solicitudes ya finalizadas. |
| **Usuarios/Roles:** Asignar o quitar roles dentro del propio módulo RRHH. |  |
| **Reportes:** Ver reportes generales del área RRHH. |  |

### 2) Analista RRHH
**Descripción:** Rol operativo. Se encarga del día a día, pero sin potestad para autorizar grandes decisiones.

| **Puede hacer** | **No puede hacer** |
|---|---|
| **Empleados:** Registrar nuevos empleados and update datos de contacto. | **Aprobaciones:** Aprobar o rechazar solicitudes de ausencia. |
| **Solicitudes de ausencia:** Dar seguimiento, registrar solicitudes and adjuntar documentos. | **Contratos:** Crear, editar or finalizar contratos. |
| **Documentos:** Subir, visualizar y organizar documentos associated to solicitudes. | **Horas extra:** Autorizar or canjear horas extra. |
| **Consultas:** Ver contratos, ausencias, horas extra y fichas de empleados. | **Usuarios/Roles:** Crear usuarios, asignar or quitar roles. |
| **Tipo de ausencia:** Consultar el catálogo of tipos de ausencia. | **Datos sensibles:** Ver `sueldo_base` o modificarlo. |

### 3) Asistente RRHH
**Descripción:** Rol más restrictivo. Pensado para apoyo administrativo y consultas básicas.

| **Puede hacer** | **No puede hacer** |
|---|---|
| **Consulta:** Ver listado de empleados y su ficha básica. | **Aprobaciones:** Aprobar, rechazar or tomar decisiones sobre solicitudes. |
| **Solicitudes:** Ver el estado de las solicitudes de ausencia. | **Contratos:** Crear, editar or ver el `sueldo_base` del contrato. |
| **Documentos:** Subir documentos a solicitudes that already están registradas. | **Empleados:** Crear, editar or dar de baja empleados. |
| **Horas extra:** Consultar horas extra registradas. | **Usuarios/Roles:** Gestionar cuentas de usuario or permisos. |
| **Calendario:** Visualizar ausencias aprobadas. | **Auditoría:** Ver el historial of `auditoria`. |

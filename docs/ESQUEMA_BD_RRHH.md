# Esquema de Base de Datos - Módulo RRHH (Lesgo-RRHH)

Este documento describe the esquema propuesto for the RRHH module of the ERP. Se basa en la definición DBML proporcionada.

## Diagrama relacional (referencias)

```text
departamento (1)──< cargo
cargo ──< contrato_cargo >── contrato ──< empleado
empleado ──< empleado_rol >── rol
empleado ──< contrato
empleado ──< hora_extra
empleado ──< solicitud_ausencia
empleado ──(1:1)── usuario
tipo_ausencia ──< solicitud_ausencia
solicitud_ausencia ──< documento
empleado (actor) ──< auditoria
```

## Tablas

### `departamento`
| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_departamento` | `INT` | PK, AUTO_INCREMENT | Identificador único |
| `nombre` | `VARCHAR(100)` | NOT NULL, UNIQUE | Nombre del departamento |
| `descripcion` | `VARCHAR(255)` | NULL | Descripción del departamento |

### `cargo`
| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_cargo` | `INT` | PK, AUTO_INCREMENT | Identificador único |
| `id_departamento` | `INT` | NOT NULL, FK → `departamento(id_departamento)` | Departamento al que pertenece |
| `nombre` | `VARCHAR(100)` | NOT NULL | Nombre del cargo |
| `descripcion` | `VARCHAR(255)` | NULL | Descripción del cargo |

### `rol`
| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_rol` | `INT` | PK, AUTO_INCREMENT | Identificador único |
| `nombre` | `VARCHAR(100)` | NOT NULL, UNIQUE | Nombre del rol |
| `descripcion` | `VARCHAR(255)` | NULL | Descripción del rol |

### `empleado`
| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|---
| `id_empleado` | `INT` | PK, AUTO_INCREMENT | Identificador único |
| `rut` | `VARCHAR(12)` | NOT NULL, UNIQUE | RUT del empleado |
| `nombre` | `VARCHAR(100)` | NOT NULL | Nombre |
| `apellido` | `VARCHAR(100)` | NOT NULL | Apellido |
| `fecha_nacimiento` | `DATE` | NULL | Fecha de nacimiento |
| `email` | `VARCHAR(150)` | NULL | Correo electrónico |
| `telefono` | `VARCHAR(30)` | NULL | Teléfono |
| `direccion` | `VARCHAR(255)` | NULL | Dirección |
| `fecha_ingreso` | `DATE` | NOT NULL | Fecha de ingreso |
| `estado` | `VARCHAR(20)` | NOT NULL, DEFAULT `'activo'` | Estado: `activo` \| `inactivo` |

### `empleado_rol` (N:M)
| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_empleado` | `INT` | FK → `empleado(id_empleado)` | Empleado |
| `id_rol` | `INT` | FK → `rol(id_rol)` | Rol |

**Clave primaria compuesta:** `(id_empleado, id_rol)`

### `contrato`
| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_contrato` | `INT` | PK, AUTO_INCREMENT | Identificador único |
| `id_empleado` | `INT` | NOT NULL, FK → `empleado(id_empleado)` | Empleado asociado |
| `fecha_inicio` | `DATE` | NOT NULL | Fecha de inicio del contrato |
| `fecha_fin` | `DATE` | NULL | Fecha de término (NULL si vigente) |
| `tipo_contrato` | `VARCHAR(50)` | NOT NULL | Tipo de contrato |
| `sueldo_base` | `DECIMAL(10,2)` | NOT NULL | Sueldo base |
| `jornada` | `VARCHAR(100)` | NULL | Jornada laboral |
| `periodo_pago` | `VARCHAR(20)` | NULL | Periodo de pago |
| `estado` | `VARCHAR(20)` | NOT NULL, DEFAULT `'activo'` | Estado: `activo` \| `finalizado` |

### `contrato_cargo` (N:M entre contrato y cargo)
| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_contrato` | `INT` | FK → `contrato(id_contrato)` | Contrato |
| `id_cargo` | `INT` | FK → `cargo(id_cargo)` | Cargo/función |

**Clave primaria compuesta:** `(id_contrato, id_cargo)`

### `hora_extra`
| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_hora` | `INT` | PK, AUTO_INCREMENT | Identificador único |
| `id_empleado` | `INT` | NOT NULL, FK → `empleado(id_empleado)` | Empleado |
| `fecha_trabajada` | `DATE` | NOT NULL | Fecha trabajada |
| `horas` | `DECIMAL(5,2)` | NOT NULL | Cantidad de horas extras |
| `motivo` | `VARCHAR(255)` | NULL | Motivo |
| `estado` | `VARCHAR(20)` | NOT NULL, DEFAULT `'pendiente'` | Estado: `pendiente` \| `canjeada` |
| `tipo_canje` | `VARCHAR(20)` | NULL | Tipo de canje: `dia_libre` \| `sueldo` \| `null` |
| `dias_credito` | `DECIMAL(5,2)` | NULL | Días de crédito generados |
| `importe_sueldo` | `DECIMAL(10,2)` | NULL | Importe si se canjea por sueldo |
| `fecha_canje` | `DATE` | NULL | Fecha en que fue canjeada |

### `tipo_ausencia`
| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_tipo_ausencia` | `INT` | PK, AUTO_INCREMENT | Identificador único |
| `nombre` | `VARCHAR(100)` | NOT NULL, UNIQUE | Nombre del tipo de ausencia |
| `descripcion` | `VARCHAR(255)` | NULL | Descripción |
| `requiere_documento` | `BOOLEAN` | NOT NULL, DEFAULT `false` | Indica si requiere documento adjunto |

### `solicitud_ausencia`
| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_solicitud` | `INT` | PK, AUTO_INCREMENT | Identificador único |
| `id_empleado` | `INT` | NOT NULL, FK → `empleado(id_empleado)` | Empleado solicitante |
| `id_tipo_ausencia` | `INT` | NOT NULL, FK → `tipo_ausencia(id_tipo_ausencia)` | Tipo de ausencia |
| `fecha_inicio` | `DATE` | NOT NULL | Fecha de inicio |
| `fecha_fin` | `DATE` | NOT NULL | Fecha de término |
| `dias_solicitados` | `INT` | NOT NULL | Cantidad de días solicitados |
| `motivo` | `VARCHAR(255)` | NULL | Motivo de la solicitud |
| `estado` | `VARCHAR(20)` | NOT NULL, DEFAULT `'pendiente'` | `pendiente` \| `aprobada` \| `rechazada` \| `cancelada` \| `en_curso` \| `finalizada` |
| `fecha_solicitud` | `TIMESTAMP` | NOT NULL | Fecha/hora de solicitud |
| `decision_aplicada_por` | `INT` | FK → `empleado(id_empleado)` | Empleado que tomó la decisión |
| `fecha_decision` | `TIMESTAMP` | NULL | Fecha/hora de decisión |
| `motivo_rechazo` | `VARCHAR(255)` | NULL | Motivo if was rejected |

### `documento`
| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_documento` | `INT` | PK, AUTO_INCREMENT | Identificador único |
| `id_solicitud` | `INT` | FK → `solicitud_ausencia(id_solicitud)` | Solicitud asociada (opcional) |
| `nombre_archivo` | `VARCHAR(255)` | NOT NULL | Nombre original del archivo |
| `ruta` | `VARCHAR(500)` | NOT NULL | Ruta/ubicación del archivo |
| `tipo` | `VARCHAR(50)` | NULL | Tipo/mime or classification |
| `subido_en` | `TIMESTAMP` | NOT NULL | Fecha/hora de subida |

### `usuario` (1:1 con empleado)
| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_empleado` | `INT` | PK, FK → `empleado(id_empleado)` ON DELETE RESTRICT | Empleado al que pertenece la cuenta |
| `password_hash` | `VARCHAR(255)` | NOT NULL | Hash de la contraseña |
| `estado` | `VARCHAR(20)` | NOT NULL, DEFAULT `'activo'` | Estado: `activo` \| `inactivo` \| `bloqueado` |
| `fecha_creacion` | `TIMESTAMP` | NOT NULL, DEFAULT `NOW()` | Fecha de creación de la cuenta |
| `ultimo_login` | `TIMESTAMP` | NULL | Última fecha/hora de inicio de sesión |
| `intentos_fallidos` | `INT` | NOT NULL, DEFAULT `0` | Intentos fallidos de login |
| `debe_cambiar_clave` | `BOOLEAN` | NOT NULL, DEFAULT `FALSE` | Indica si debe cambiar la contraseña en el próximo login |

### `auditoria`
| Campo | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_auditoria` | `INT` | PK, AUTO_INCREMENT | Identificador único |
| `id_empleado_actor` | `INT` | FK → `empleador(id_empleado)` | Empleado que realizó la acción |
| `accion` | `VARCHAR(50)` | NOT NULL | Tipo de acción (ej. CREATE/UPDATE/DELETE) |
| `entidad` | `VARCHAR(100)` | NOT NULL | Entidad afectada (ej. empleado, contrato) |
| `id_registro` | `VARCHAR(100)` | NULL | ID of the affected record |
| `valor_anterior` | `JSONB` | NULL | Estado anterior del registro |
| `valor_nuevo` | `JSONB` | NULL | Estado nuevo del registro |
| `fecha_hora` | `TIMESTAMP` | NOT NULL | Fecha/hora del evento |
| `ip` | `VARCHAR(45)` | NULL | Dirección IP |

## Notas
- Las claves foráneas mantienen integridad referencial.
- `empleado_rol` and `contrato_cargo` are many-to-many relations with composite key.
- `usuario` es relación **1:1** con `empleado`: `id_empleado` es PK y FK.
- Login se realiza con el **email** de `empleado` y el **password_hash** de `usuario`.
- `hora_extra` supports exchange flow (pendiente → canjeada) with fields for credit/money.
- `solicitud_ausencia` registra flujo completo con quién decidió y cuándo.
- `auditoria` permite trazabilidad with before/after values in JSONB format.

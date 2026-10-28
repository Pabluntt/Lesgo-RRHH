CREATE SCHEMA IF NOT EXISTS rrhh;

SET search_path TO rrhh;

-- Departamento
CREATE TABLE departamento (
  id_departamento SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion VARCHAR(255)
);

-- Cargo
CREATE TABLE cargo (
  id_cargo SERIAL PRIMARY KEY,
  id_departamento INT NOT NULL REFERENCES departamento(id_departamento),
  nombre VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255)
);

-- Rol
CREATE TABLE rol (
  id_rol SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion VARCHAR(255)
);

-- Empleado
CREATE TABLE empleado (
  id_empleado SERIAL PRIMARY KEY,
  rut VARCHAR(12) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  fecha_nacimiento DATE,
  email VARCHAR(150),
  telefono VARCHAR(30),
  direccion VARCHAR(255),
  fecha_ingreso DATE NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo','inactivo'))
);

-- Empleado - Rol
CREATE TABLE empleado_rol (
  id_empleado INT NOT NULL REFERENCES empleado(id_empleado),
  id_rol INT NOT NULL REFERENCES rol(id_rol),
  PRIMARY KEY (id_empleado, id_rol)
);

-- Contrato
CREATE TABLE contrato (
  id_contrato SERIAL PRIMARY KEY,
  id_empleado INT NOT NULL REFERENCES empleado(id_empleado),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  tipo_contrato VARCHAR(50) NOT NULL,
  sueldo_base NUMERIC(10,2) NOT NULL,
  jornada VARCHAR(100),
  periodo_pago VARCHAR(20),
  estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo','finalizado')),
  CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);

-- Contrato - Cargo
CREATE TABLE contrato_cargo (
  id_contrato INT NOT NULL REFERENCES contrato(id_contrato),
  id_cargo INT NOT NULL REFERENCES cargo(id_cargo),
  PRIMARY KEY (id_contrato, id_cargo)
);

-- Hora Extra
CREATE TABLE hora_extra (
  id_hora SERIAL PRIMARY KEY,
  id_empleado INT NOT NULL REFERENCES empleado(id_empleado),
  fecha_trabajada DATE NOT NULL,
  horas NUMERIC(5,2) NOT NULL,
  motivo VARCHAR(255),
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','canjeada')),
  tipo_canje VARCHAR(20) CHECK (tipo_canje IN ('dia_libre','sueldo')),
  dias_credito NUMERIC(5,2),
  importe_sueldo NUMERIC(10,2),
  fecha_canje DATE
);

-- Tipo de Ausencia
CREATE TABLE tipo_ausencia (
  id_tipo_ausencia SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion VARCHAR(255),
  requiere_documento BOOLEAN NOT NULL DEFAULT FALSE
);

-- Solicitud de Ausencia
CREATE TABLE solicitud_ausencia (
  id_solicitud SERIAL PRIMARY KEY,
  id_empleado INT NOT NULL REFERENCES empleado(id_empleado),
  id_tipo_ausencia INT NOT NULL REFERENCES tipo_ausencia(id_tipo_ausencia),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  dias_solicitados INT NOT NULL,
  motivo VARCHAR(255),
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aprobada','rechazada','cancelada','en_curso','finalizada')),
  fecha_solicitud TIMESTAMP NOT NULL DEFAULT NOW(),
  decision_aplicada_por INT REFERENCES empleado(id_empleado),
  fecha_decision TIMESTAMP,
  motivo_rechazo VARCHAR(255),
  CHECK (fecha_fin >= fecha_inicio)
);

-- Documento
CREATE TABLE documento (
  id_documento SERIAL PRIMARY KEY,
  id_solicitud INT REFERENCES solicitud_ausencia(id_solicitud),
  nombre_archivo VARCHAR(255) NOT NULL,
  ruta VARCHAR(500) NOT NULL,
  tipo VARCHAR(50),
  subido_en TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Auditoria
CREATE TABLE auditoria (
  id_auditoria SERIAL PRIMARY KEY,
  id_empleado_actor INT REFERENCES empleado(id_empleado),
  accion VARCHAR(50) NOT NULL,
  entidad VARCHAR(100) NOT NULL,
  id_registro VARCHAR(100),
  valor_anterior JSONB,
  valor_nuevo JSONB,
  fecha_hora TIMESTAMP NOT NULL DEFAULT NOW(),
  ip VARCHAR(45)
);

CREATE SCHEMA IF NOT EXISTS rrhh;
SET search_path TO rrhh;

CREATE TABLE usuario (
  id_empleado INT PRIMARY KEY REFERENCES empleado(id_empleado) ON DELETE RESTRICT,
  password_hash VARCHAR(255) NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'bloqueado')),
  fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
  ultimo_login TIMESTAMP,
  intentos_fallidos INT NOT NULL DEFAULT 0,
  debe_cambiar_clave BOOLEAN NOT NULL DEFAULT FALSE
);

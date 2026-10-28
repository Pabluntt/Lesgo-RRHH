CREATE SCHEMA IF NOT EXISTS rrhh;
SET search_path TO rrhh;

-- 1) DEPARTAMENTO (8 registros)
INSERT INTO departamento (nombre, descripcion) VALUES
('Compras', 'Adquisiciones y proveedores'),
('Inventario', 'Control de stock y almacenes'),
('e-Commerce y Ventas', 'Comercialización online y ventas'),
('CRM', 'Gestión de clientes y relaciones comerciales'),
('Recursos Humanos', 'Gestión del talento humano'),
('Logística y Transporte', 'Transporte, distribución y despacho'),
('Finanzas', 'Contabilidad, facturación y tesorería'),
('Postventa', 'Soporte, garantías y atención postventa');

-- 2) CARGO (10 registros)
INSERT INTO cargo (id_departamento, nombre, descripcion) VALUES
(1, 'Comprador(a)', 'Negociación y compra de insumos'),
(2, 'Jefe(a) de Inventario', 'Control y gestión de bodegas'),
(3, 'Ejecutivo(a) de Ventas', 'Gestión de clientes y ventas'),
(4, 'Ejecutivo(a) CRM', 'Seguimiento y fidelización de clientes'),
(5, 'Jefe(a) de RRHH', 'Dirección del área de RRHH'),
(6, 'Jefe(a) de Logística y Transporte', 'Coordinación de rutas y despachos'),
(7, 'Contador(a) General', 'Registro contable y estados financieros'),
(8, 'Agente de Postventa', 'Atención, reclamos y seguimiento'),
(5, 'Desarrollador(a) Fullstack', 'Desarrollo y mantención de sistemas'),
(5, 'Analista de RRHH', 'Gestión documental y procesos RRHH');

-- 3) ROL (10 registros)
INSERT INTO rol (nombre, descripcion) VALUES
('Administrador', 'Acceso total al sistema'),
('Jefe RRHH', 'Autorización de solicitudes y contratos'),
('Coordinador', 'Supervisión de equipo'),
('Analista', 'Consulta y reportes'),
('Asistente', 'Gestión operativa'),
('Supervisor', 'Seguimiento y aprobación'),
('Contador', 'Acceso a módulo financiero'),
('Desarrollador', 'Mantenimiento técnico'),
('Vendedor', 'Acceso a módulo comercial'),
('Auditor', 'Revisión y trazabilidad');

-- 4) EMPLEADO (10 registros)
INSERT INTO empleado (rut, nombre, apellido, fecha_nacimiento, email, telefono, direccion, fecha_ingreso, estado) VALUES
('11111111-1', 'Camila', 'Soto', '1990-05-12', 'camila.soto@lesgo.cl', '+56911111111', 'Av. Providencia 1234, Santiago', '2018-03-01', 'activo'),
('22222222-2', 'Matías', 'Rojas', '1988-09-24', 'matias.rojas@lesgo.cl', '+56922222222', 'Calle Los Alerces 456, Ñuñoa', '2019-04-15', 'activo'),
('33333333-3', 'Javiera', 'Muñoz', '1992-11-08', 'javiera.munoz@lesgo.cl', '+56933333333', 'Av. Las Condes 7890, Las Condes', '2020-02-10', 'activo'),
('44444444-4', 'Felipe', 'Contreras', '1991-07-03', 'felipe.contreras@lesgo.cl', '+56944444444', 'Pasaje San Martín 321, Maipú', '2020-06-01', 'activo'),
('55555555-5', 'Constanza', 'Vergara', '1993-01-19', 'constanza.vergara@lesgo.cl', '+56955555555', 'Calle Holanda 654, Providencia', '2021-01-08', 'activo'),
('66666666-6', 'Ignacio', 'Fuentes', '1989-12-27', 'ignacio.fuentes@lesgo.cl', '+56966666666', 'Av. Grecia 987, Ñuñoa', '2021-05-17', 'activo'),
('77777777-7', 'Valentina', 'Pérez', '1994-04-06', 'valentina.perez@lesgo.cl', '+56977777777', 'Calle Ecuador 159, Santiago Centro', '2022-03-07', 'activo'),
('88888888-8', 'Benjamín', 'Araya', '1990-10-14', 'benjamin.araya@lesgo.cl', '+56988888888', 'Av. Apoquindo 2468, Las Condes', '2022-08-22', 'activo'),
('99999999-9', 'Antonia', 'Cáceres', '1995-06-30', 'antonia.caceres@lesgo.cl', '+56999999999', 'Calle Lira 753, Santiago Centro', '2023-02-13', 'activo'),
('10101010-0', 'Tomás', 'Navarro', '1992-03-09', 'tomas.navarro@lesgo.cl', '+56910101010', 'Av. Vicuña Mackenna 8520, Macul', '2023-09-04', 'activo');

-- 5) EMPLEADO_ROL (10 registros)
INSERT INTO empleado_rol (id_empleado, id_rol) VALUES
(1,2),(2,8),(3,9),(4,7),(5,3),(6,5),(7,4),(8,6),(9,10),(10,1);

-- 6) CONTRATO (10 registros)
INSERT INTO contrato (id_empleado, fecha_inicio, fecha_fin, tipo_contrato, sueldo_base, jornada, periodo_pago, estado) VALUES
(1,'2018-03-01',NULL,'Indefinido',1500000.00,'Completa 44 hrs','Mensual','activo'),
(2,'2019-04-15',NULL,'Indefinido',1800000.00,'Completa 44 hrs','Mensual','activo'),
(3,'2020-02-10',NULL,'Indefinido',950000.00,'Completa 44 hrs','Mensual','activo'),
(4,'2020-06-01',NULL,'Indefinido',1300000.00,'Completa 44 hrs','Mensual','activo'),
(5,'2021-01-08',NULL,'Indefinido',1100000.00,'Completa 44 hrs','Mensual','activo'),
(6,'2021-05-17',NULL,'Plazo Fijo',650000.00,'Completa 44 hrs','Mensual','activo'),
(7,'2022-03-07',NULL,'Indefinido',850000.00,'Completa 44 hrs','Mensual','activo'),
(8,'2022-08-22',NULL,'Indefinido',1000000.00,'Completa 44 hrs','Mensual','activo'),
(9,'2023-02-13',NULL,'Plazo Fijo',550000.00,'Parcial 30 hrs','Mensual','activo'),
(10,'2023-09-04',NULL,'Indefinido',1700000.00,'Completa 44 hrs','Mensual','activo');

-- 7) CONTRATO_CARGO (10 registros)
INSERT INTO contrato_cargo (id_contrato, id_cargo) VALUES
(1,5),(2,9),(3,3),(4,7),(5,6),(6,2),(7,1),(8,4),(9,8),(10,10);

-- 8) TIPO_AUSENCIA (10 registros)
INSERT INTO tipo_ausencia (nombre, descripcion, requiere_documento) VALUES
('Vacaciones','Descanso anual legal',FALSE),
('Licencia Médica','Ausencia por enfermedad o accidente',TRUE),
('Permiso Administrativo','Permiso con goce o sin goce según caso',FALSE),
('Permiso por Fallecimiento','Permiso por duelo familiar',TRUE),
('Permiso por Matrimonio','Permiso por matrimonio del trabajador',FALSE),
('Licencia Maternal/Paternal','Permiso por nacimiento de hijo/a',TRUE),
('Permiso Gremial','Ausencia por representación sindical',FALSE),
('Ausencia por Cita Médica','Cita médica debidamente acreditada',TRUE),
('Permiso por Traslado','Permiso por cambio de residencia justificado',FALSE),
('Licencia por Accidente Laboral','Ausencia derivada de accidente de trabajo',TRUE);

-- 9) SOLICITUD_AUSENCIA (10 registros)
INSERT INTO solicitud_ausencia (id_empleado, id_tipo_ausencia, fecha_inicio, fecha_fin, dias_solicitados, motivo, estado, fecha_solicitud, decision_aplicada_por, fecha_decision, motivo_rechazo) VALUES
(3,1,'2026-01-12','2026-01-16',5,'Vacaciones programadas','aprobada','2025-12-20 09:15:00',1,'2025-12-22 10:00:00',NULL),
(2,2,'2026-02-03','2026-02-05',3,'Gripe con reposo médico','aprobada','2026-02-03 08:40:00',1,'2026-02-03 11:20:00',NULL),
(5,3,'2026-03-10','2026-03-10',1,'Trámite personal en notaría','aprobada','2026-03-08 14:25:00',1,'2026-03-09 09:10:00',NULL),
(7,4,'2026-04-07','2026-04-09',3,'Fallecimiento de familiar directo','aprobada','2026-04-07 07:50:00',1,'2026-04-07 08:30:00',NULL),
(6,5,'2026-05-12','2026-05-16',5,'Matrimonio','aprobada','2026-04-15 16:00:00',1,'2026-04-18 10:15:00',NULL),
(4,6,'2026-06-02','2026-08-01',61,'Postnatal','aprobada','2026-05-20 09:00:00',1,'2026-05-22 12:00:00',NULL),
(8,7,'2026-07-09','2026-07-09',1,'Asamblea sindical','aprobada','2026-07-07 11:30:00',1,'2026-07-08 08:45:00',NULL),
(9,8,'2026-08-14','2026-08-14',1,'Cita con especialista','rechazada','2026-08-13 15:10:00',1,'2026-08-13 16:05:00','No se adjuntó certificado médico'),
(3,3,'2026-09-05','2026-09-05',1,'Trámite bancario','pendiente','2026-09-04 10:20:00',NULL,NULL,NULL),
(2,1,'2026-10-13','2026-10-24',10,'Vacaciones acumuladas','pendiente','2026-10-01 09:00:00',NULL,NULL,NULL);

-- 10) HORA_EXTRA (10 registros)
INSERT INTO hora_extra (id_empleado, fecha_trabajada, horas, motivo, estado, tipo_canje, dias_credito, importe_sueldo, fecha_canje) VALUES
(2,'2026-03-12',2.00,'Soporte crítico en producción','canjeada','sueldo',NULL,36000.00,'2026-03-25'),
(3,'2026-04-09',1.50,'Cierre de mes ventas','canjeada','dia_libre',0.25,NULL,'2026-04-28'),
(4,'2026-05-07',3.00,'Cierre contable','canjeada','sueldo',NULL,65000.00,'2026-05-30'),
(5,'2026-06-11',2.00,'Inventario bodega','canjeada','dia_libre',0.33,NULL,'2026-06-27'),
(6,'2026-07-16',1.00,'Entrega de campaña','canjeada','sueldo',NULL,15000.00,'2026-07-31'),
(7,'2026-08-06',2.50,'Cotizaciones urgentes','canjeada','dia_libre',0.42,NULL,'2026-08-29'),
(8,'2026-09-03',2.00,'Revisión contrato urgente','pendiente',NULL,NULL,NULL,NULL),
(1,'2026-09-17',1.50,'Reunión con gerencia','pendiente',NULL,NULL,NULL,NULL),
(10,'2026-10-08',3.00,'Soporte a ventas','pendiente',NULL,NULL,NULL,NULL),
(9,'2026-10-22',2.00,'Cobertura turno tarde','pendiente',NULL,NULL,NULL,NULL);

-- 11) DOCUMENTO (10 registros)
INSERT INTO documento (id_solicitud, nombre_archivo, ruta, tipo, subido_en) VALUES
(2,'certificado_medico.pdf','/documentos/rrhh/licencias/certificado_medico_002.pdf','application/pdf','2026-02-03 09:00:00'),
(4,'certificado_defuncion.pdf','/documentos/rrhh/permisos/certificado_defuncion_004.pdf','application/pdf','2026-04-07 08:10:00'),
(6,'certificado_prenatal.pdf','/documentos/rrhh/licencias/certificado_prenatal_006.pdf','application/pdf','2026-05-20 09:30:00'),
(7,'comunicado_sindical.pdf','/documentos/rrhh/permisos/comunicado_sindical_007.pdf','application/pdf','2026-07-07 12:00:00'),
(10,'comprobante_vacaciones.pdf','/documentos/rrhh/vacaciones/comprobante_vacaciones_010.pdf','application/pdf','2026-10-01 09:15:00'),
(3,'solicitud_interna.pdf','/documentos/rrhh/permisos/solicitud_interna_003.pdf','application/pdf','2026-03-08 14:40:00'),
(5,'invitacion_matrimonio.pdf','/documentos/rrhh/permisos/invitacion_matrimonio_005.pdf','application/pdf','2026-04-15 16:15:00'),
(1,'plan_vacaciones.pdf','/documentos/rrhh/vacaciones/plan_vacaciones_001.pdf','application/pdf','2025-12-20 09:25:00'),
(8,'cita_especialista.pdf','/documentos/rrhh/licencias/cita_especialista_008.pdf','application/pdf','2026-08-13 15:20:00'),
(9,'tramite_bancario.pdf','/documentos/rrhh/permisos/tramite_bancario_009.pdf','application/pdf','2026-09-04 10:30:00');

-- 12) AUDITORIA (10 registros)
INSERT INTO auditoria (id_empleado_actor, accion, entidad, id_registro, valor_anterior, valor_nuevo, fecha_hora, ip) VALUES
(1,'CREATE','contrato','1',NULL,'{"id_contrato":1,"id_empleado":1,"tipo_contrato":"Indefinido","estado":"activo"}','2018-03-01 09:00:00','192.168.1.10'),
(1,'CREATE','empleado','2',NULL,'{"id_empleado":2,"nombre":"Matías","apellido":"Rojas","estado":"activo"}','2019-04-15 09:05:00','192.168.1.10'),
(1,'UPDATE','solicitud_ausencia','2','{"estado":"pendiente"}','{"estado":"aprobada","decision_aplicada_por":1}','2026-02-03 11:20:00','192.168.1.15'),
(1,'UPDATE','hora_extra','2','{"estado":"pendiente"}','{"estado":"canjeada","tipo_canje":"sueldo"}','2026-03-25 14:10:00','192.168.1.15'),
(1,'UPDATE','solicitud_ausencia','8','{"estado":"pendiente"}','{"estado":"rechazada","motivo_rechazo":"No se adjuntó certificado médico"}','2026-08-13 16:05:00','192.168.1.15'),
(10,'CREATE','empleado','9',NULL,'{"id_empleado":9,"nombre":"Antonia","apellido":"Cáceres","estado":"activo"}','2023-02-13 08:50:00','192.168.1.20'),
(5,'UPDATE','empleado','6','{"estado":"activo"}','{"estado":"activo","telefono":"+56966666666"}','2024-01-10 13:25:00','192.168.1.12'),
(2,'CREATE','hora_extra','8',NULL,'{"id_hora":8,"id_empleado":1,"horas":1.50,"estado":"pendiente"}','2026-09-17 18:00:00','192.168.1.18'),
(1,'UPDATE','contrato','6','{"estado":"activo"}','{"estado":"activo","sueldo_base":650000.00}','2026-07-01 09:40:00','192.168.1.10'),
(1,'DELETE','documento','11','{"id_documento":11,"nombre_archivo":"tramite_bancario.pdf"}',NULL,'2026-10-05 11:15:00','192.168.1.15');

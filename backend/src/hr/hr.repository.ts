import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PoolClient } from 'pg'
import { DatabaseService } from '../db/database.service'
import { AbsenceRequest, Employee } from './hr.types'
import { initialVacationDays } from './validation'

const VACATION_TYPE = 'Vacaciones'
// Estados que no consumen saldo ni bloquean fechas.
const RELEASED_STATES = ['rechazada', 'cancelada']

const statusLabels: Record<string, AbsenceRequest['status']> = {
  pendiente: 'Pendiente', aprobada: 'Aprobada', rechazada: 'Rechazada', cancelada: 'Cancelada', en_curso: 'En curso', finalizada: 'Finalizada',
}

interface EmployeeRow { id_empleado: number; rut: string; nombre: string; apellido: string; email: string | null; telefono: string | null; direccion: string | null; fecha_nacimiento: string | null; rol: string | null; usados: number }
interface RequestRow { id_solicitud: number; id_empleado: number; tipo: string; fecha_inicio: string; fecha_fin: string; dias_solicitados: number; motivo: string | null; estado: string }

// Acceso a las tablas rrhh.* para usuarios, perfiles y solicitudes de vacaciones.
@Injectable()
export class HrRepository {
  constructor(private readonly db: DatabaseService) {}

  async roles() {
    return (await this.db.query<{ nombre: string }>('SELECT nombre FROM rrhh.rol ORDER BY id_rol')).map(row => row.nombre)
  }

  async findLogin(email: string) {
    const [row] = await this.db.query<{ id_empleado: number; password_hash: string; estado: string; rol: string | null }>(
      `SELECT u.id_empleado, u.password_hash, u.estado, ${roleSubquery} AS rol
       FROM rrhh.usuario u JOIN rrhh.empleado e USING (id_empleado)
       WHERE lower(e.email) = $1`, [email])
    return row
  }

  async recordLogin(employeeId: number, success: boolean) {
    await this.db.query(success
      ? 'UPDATE rrhh.usuario SET ultimo_login = NOW(), intentos_fallidos = 0 WHERE id_empleado = $1'
      : 'UPDATE rrhh.usuario SET intentos_fallidos = intentos_fallidos + 1 WHERE id_empleado = $1', [employeeId])
  }

  async findAccount(employeeId: number) {
    const [row] = await this.db.query<{ email: string; estado: string; rol: string | null }>(
      `SELECT e.email, u.estado, ${roleSubquery} AS rol
       FROM rrhh.usuario u JOIN rrhh.empleado e USING (id_empleado)
       WHERE u.id_empleado = $1`, [employeeId])
    return row
  }

  async employee(id: number): Promise<Employee | undefined> {
    const [row] = await this.db.query<EmployeeRow>(
      `SELECT e.id_empleado, e.rut, e.nombre, e.apellido, e.email, e.telefono, e.direccion, e.fecha_nacimiento, ${roleSubquery} AS rol,
         (SELECT COALESCE(SUM(s.dias_solicitados), 0)::int FROM rrhh.solicitud_ausencia s JOIN rrhh.tipo_ausencia t USING (id_tipo_ausencia)
          WHERE s.id_empleado = e.id_empleado AND t.nombre = $2 AND s.estado <> ALL($3)) AS usados
       FROM rrhh.empleado e WHERE e.id_empleado = $1`, [id, VACATION_TYPE, RELEASED_STATES])
    if (!row) return undefined
    const approvedToday = (await this.requests(id)).some(item => item.status === 'Aprobada' && item.startDate <= today() && item.endDate >= today())
    return {
      id: row.id_empleado,
      rut: row.rut,
      name: `${row.nombre} ${row.apellido}`,
      surname: row.apellido,
      email: row.email ?? '',
      phone: row.telefono ?? undefined,
      address: row.direccion ?? undefined,
      birthDate: row.fecha_nacimiento ?? undefined,
      department: 'Por asignar',
      jobTitle: 'Por asignar',
      role: row.rol ?? 'Sin rol',
      status: approvedToday ? 'Ausente' : 'Presente',
      vacationDays: initialVacationDays - row.usados,
      // El esquema no tiene indicador de perfil: se considera completo cuando RRHH y el empleado llenaron estos datos.
      profileComplete: Boolean(row.email && row.telefono && row.direccion && row.fecha_nacimiento),
    }
  }

  async requests(employeeId: number): Promise<AbsenceRequest[]> {
    const rows = await this.db.query<RequestRow>(
      `SELECT s.id_solicitud, s.id_empleado, t.nombre AS tipo, s.fecha_inicio, s.fecha_fin, s.dias_solicitados, s.motivo, s.estado
       FROM rrhh.solicitud_ausencia s JOIN rrhh.tipo_ausencia t USING (id_tipo_ausencia)
       WHERE s.id_empleado = $1 ORDER BY s.fecha_inicio DESC`, [employeeId])
    return rows.map(toRequest)
  }

  async createUser(data: { email: string; passwordHash: string; name: string; surname: string; rut: string; role: string }, actorId: number | null) {
    return this.db.transaction(async client => {
      const [role] = (await client.query<{ id_rol: number }>('SELECT id_rol FROM rrhh.rol WHERE nombre = $1', [data.role])).rows
      if (!role) throw new BadRequestException('Rol inválido')
      if ((await client.query('SELECT 1 FROM rrhh.empleado WHERE rut = $1', [data.rut])).rowCount) throw new BadRequestException('Ya existe un empleado con ese RUT')
      if ((await client.query('SELECT 1 FROM rrhh.empleado WHERE lower(email) = $1', [data.email])).rowCount) throw new BadRequestException('Ya existe un empleado con ese correo')
      const [employee] = (await client.query<{ id_empleado: number }>(
        `INSERT INTO rrhh.empleado (rut, nombre, apellido, email, fecha_ingreso) VALUES ($1, $2, $3, $4, CURRENT_DATE) RETURNING id_empleado`,
        [data.rut, data.name, data.surname, data.email])).rows
      await client.query('INSERT INTO rrhh.empleado_rol (id_empleado, id_rol) VALUES ($1, $2)', [employee.id_empleado, role.id_rol])
      await client.query('INSERT INTO rrhh.usuario (id_empleado, password_hash) VALUES ($1, $2)', [employee.id_empleado, data.passwordHash])
      await audit(client, actorId, 'CREATE', 'usuario', employee.id_empleado, { id_empleado: employee.id_empleado, rut: data.rut, nombre: data.name, apellido: data.surname, email: data.email, rol: data.role })
      return employee.id_empleado
    })
  }

  async completeProfile(employeeId: number, data: { phone: string; address: string; birthDate: string }) {
    await this.db.transaction(async client => {
      const result = await client.query('UPDATE rrhh.empleado SET telefono = $2, direccion = $3, fecha_nacimiento = $4 WHERE id_empleado = $1',
        [employeeId, data.phone, data.address, data.birthDate])
      if (!result.rowCount) throw new NotFoundException('Empleado no encontrado')
      await audit(client, employeeId, 'UPDATE', 'empleado', employeeId, { telefono: data.phone, direccion: data.address, fecha_nacimiento: data.birthDate })
    })
  }

  async createVacation(employeeId: number, startDate: string, endDate: string, days: number) {
    return this.db.transaction(async client => {
      // Bloquea al empleado para que dos solicitudes simultáneas no consuman el mismo saldo.
      if (!(await client.query('SELECT 1 FROM rrhh.empleado WHERE id_empleado = $1 FOR UPDATE', [employeeId])).rowCount) throw new NotFoundException('Empleado no encontrado')
      const [type] = (await client.query<{ id_tipo_ausencia: number }>('SELECT id_tipo_ausencia FROM rrhh.tipo_ausencia WHERE nombre = $1', [VACATION_TYPE])).rows
      if (!type) throw new BadRequestException('No existe el tipo de ausencia "Vacaciones" en la base de datos')
      const [{ usados }] = (await client.query<{ usados: number }>(
        `SELECT COALESCE(SUM(dias_solicitados), 0)::int AS usados FROM rrhh.solicitud_ausencia WHERE id_empleado = $1 AND id_tipo_ausencia = $2 AND estado <> ALL($3)`,
        [employeeId, type.id_tipo_ausencia, RELEASED_STATES])).rows
      if (days > initialVacationDays - usados) throw new BadRequestException('El rango debe tener días hábiles y no superar el saldo disponible')
      const overlap = await client.query(
        'SELECT 1 FROM rrhh.solicitud_ausencia WHERE id_empleado = $1 AND estado <> ALL($2) AND fecha_inicio <= $4 AND fecha_fin >= $3',
        [employeeId, RELEASED_STATES, startDate, endDate])
      if (overlap.rowCount) throw new BadRequestException('Existe una solicitud que se superpone con estas fechas')
      const [row] = (await client.query<RequestRow>(
        `INSERT INTO rrhh.solicitud_ausencia (id_empleado, id_tipo_ausencia, fecha_inicio, fecha_fin, dias_solicitados, motivo)
         VALUES ($1, $2, $3, $4, $5, 'Solicitud de vacaciones')
         RETURNING id_solicitud, id_empleado, $6::text AS tipo, fecha_inicio, fecha_fin, dias_solicitados, motivo, estado`,
        [employeeId, type.id_tipo_ausencia, startDate, endDate, days, VACATION_TYPE])).rows
      await audit(client, employeeId, 'CREATE', 'solicitud_ausencia', row.id_solicitud, { id_solicitud: row.id_solicitud, id_empleado: employeeId, fecha_inicio: startDate, fecha_fin: endDate, dias_solicitados: days, estado: row.estado })
      return toRequest(row)
    })
  }
}

// Rol principal del empleado (el esquema permite varios; la demo usa uno).
const roleSubquery = `(SELECT r.nombre FROM rrhh.empleado_rol er JOIN rrhh.rol r USING (id_rol) WHERE er.id_empleado = e.id_empleado ORDER BY r.id_rol LIMIT 1)`

const today = () => new Date().toISOString().slice(0, 10)

function toRequest(row: RequestRow): AbsenceRequest {
  return {
    id: row.id_solicitud,
    employeeId: row.id_empleado,
    type: row.tipo === 'Licencia Médica' ? 'Licencia médica' : row.tipo,
    startDate: row.fecha_inicio,
    endDate: row.fecha_fin,
    days: row.dias_solicitados,
    reason: row.motivo ?? '',
    status: statusLabels[row.estado] ?? 'Pendiente',
  }
}

function audit(client: PoolClient, actorId: number | null, action: string, entity: string, recordId: number, value: object) {
  return client.query('INSERT INTO rrhh.auditoria (id_empleado_actor, accion, entidad, id_registro, valor_nuevo) VALUES ($1, $2, $3, $4, $5)',
    [actorId, action, entity, String(recordId), value])
}

import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { businessDays, date, managerRoles, text } from './validation'
import { AuthenticatedUser } from '../auth/auth.types'
import { AbsenceRequest, AuditLog, Employee, EmploymentContract } from './hr.types'
import { HrRepository } from './hr.repository'

const today = new Date()
const asDate = (offsetDays: number) => {
  const date = new Date(today)
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

@Injectable()
export class HrService {
  constructor(private readonly repository: HrRepository) {}

  // Datos de demostración en memoria: se reemplazarán por repositorios y BD.
  // Ya persisten en BD: cuentas creadas, perfil inicial y solicitudes de vacaciones de usuarios de BD.
  private readonly employees: Employee[] = [
    { id: 1, name: 'Alexandra Reyes', email: 'admin@lesgo.test', department: 'Recursos Humanos', jobTitle: 'Administradora', role: 'Administración', status: 'Presente' },
    { id: 2, name: 'Mateo Silva', email: 'mateo@lesgo.test', department: 'Tecnología', jobTitle: 'Desarrollador', role: 'Tecnología', status: 'Presente' },
    { id: 3, name: 'Camila Torres', email: 'camila@lesgo.test', department: 'Tecnología', jobTitle: 'Diseñadora UX', role: 'Tecnología', status: 'Remoto' },
    { id: 4, name: 'Diego Herrera', email: 'diego@lesgo.test', department: 'Operaciones', jobTitle: 'Analista', role: 'Operaciones', status: 'Presente' },
    { id: 5, name: 'Valentina Cruz', email: 'valentina@lesgo.test', department: 'Operaciones', jobTitle: 'Coordinadora', role: 'Operaciones', status: 'Ausente' },
    { id: 6, name: 'Sofía Méndez', email: 'sofia@lesgo.test', department: 'Recursos Humanos', jobTitle: 'People Partner', role: 'Recursos Humanos', status: 'Presente' },
  ]

  private readonly requests: AbsenceRequest[] = [
    { id: 1, employeeId: 2, type: 'Vacaciones', startDate: asDate(12), endDate: asDate(19), days: 6, reason: 'Viaje familiar', status: 'Pendiente' },
    { id: 2, employeeId: 4, type: 'Licencia médica', startDate: asDate(1), endDate: asDate(3), days: 3, reason: 'Reposo médico', status: 'Pendiente' },
    { id: 3, employeeId: 5, type: 'Permiso', startDate: asDate(-8), endDate: asDate(-8), days: 1, reason: 'Trámite personal', status: 'Aprobada' },
  ]

  private readonly contracts: EmploymentContract[] = [
    { id: 1, employeeId: 2, startDate: asDate(-330), endDate: asDate(18), type: 'Plazo fijo', salary: 2450, status: 'Vigente' },
    { id: 2, employeeId: 3, startDate: asDate(-210), endDate: asDate(75), type: 'Indefinido', salary: 2800, status: 'Vigente' },
    { id: 3, employeeId: 4, startDate: asDate(-400), endDate: asDate(-12), type: 'Plazo fijo', salary: 2200, status: 'Vigente' },
    { id: 4, employeeId: 6, startDate: asDate(-150), endDate: asDate(150), type: 'Indefinido', salary: 2600, status: 'Vigente' },
  ]

  private readonly logs: AuditLog[] = []
  private nextLogId = 1
  private contractCheckTimer?: NodeJS.Timeout

  onModuleInit() {
    this.employees.forEach((employee, index) => {
      employee.rut = `${String(index + 1).repeat(8)}-${index + 1}`
      employee.vacationDays = 15
      employee.profileComplete = true
    })
    this.requests.filter(item => item.type === 'Vacaciones').forEach(item => { item.days = businessDays(item.startDate, item.endDate) })
    this.finalizeExpiredContracts()
    this.contractCheckTimer = setInterval(() => this.finalizeExpiredContracts(), 60_000)
  }

  onModuleDestroy() {
    if (this.contractCheckTimer) clearInterval(this.contractCheckTimer)
  }

  async getDashboard(user: AuthenticatedUser) {
    const roles = await this.repository.roles()
    if (user.source === 'db') return this.getDatabaseDashboard(user, roles)
    this.finalizeExpiredContracts()
    const employees = this.employees.map((employee) => {
      const approvedAbsence = this.requests.some((request) =>
        request.employeeId === employee.id
        && request.status === 'Aprobada'
        && request.startDate <= asDate(0)
        && request.endDate >= asDate(0),
      )
      return approvedAbsence ? { ...employee, status: 'Ausente' as const } : employee
    })
    const manager = managerRoles.includes(user.role)
    return {
      roles,
      employees: (manager ? employees : employees.filter(item => item.id === user.employeeId)).map(item => ({ ...item, vacationDays: this.availableDays(item.id) })),
      requests: manager ? this.requests : this.requests.filter(item => item.employeeId === user.employeeId),
      contracts: manager ? this.contracts : this.contracts.filter(item => item.employeeId === user.employeeId),
      logs: manager ? this.logs : this.logs.filter(item => item.userId === user.id),
      account: {
        ...user,
        employee: employees.find((employee) => employee.id === user.employeeId),
      },
    }
  }

  // Usuario de BD: su empleado y solicitudes vienen de rrhh.*; la vista de equipo sigue mockeada.
  private async getDatabaseDashboard(user: AuthenticatedUser, roles: string[]) {
    const [self, ownRequests] = await Promise.all([this.repository.employee(user.employeeId), this.repository.requests(user.employeeId)])
    const manager = managerRoles.includes(user.role)
    const selfList = self ? [self] : []
    return {
      roles,
      employees: manager ? [...this.employees.map(item => ({ ...item, vacationDays: this.availableDays(item.id) })), ...selfList] : selfList,
      requests: manager ? [...this.requests, ...ownRequests] : ownRequests,
      contracts: manager ? this.contracts : [],
      logs: manager ? this.logs : this.logs.filter(item => item.userId === user.id && item.username === user.username),
      account: { ...user, employee: self },
    }
  }

  async decideRequest(id: number, decision: 'Aprobada' | 'Rechazada', user: AuthenticatedUser, reason?: string) {
    await this.requireManager(user)
    if (decision !== 'Aprobada' && decision !== 'Rechazada') {
      throw new BadRequestException('La decisión debe ser Aprobada o Rechazada')
    }
    const request = this.requests.find((item) => item.id === id)
    if (!request) throw new NotFoundException('No se encontró la solicitud')
    if (request.status !== 'Pendiente') throw new BadRequestException('La solicitud ya fue resuelta')
    request.status = decision
    this.addLog(user, `${decision} solicitud`, `Solicitud ${request.type} #${id}${reason ? `: ${reason}` : ''}`)
    return request
  }

  async renewContract(id: number, user: AuthenticatedUser) {
    await this.requireManager(user)
    const contract = this.findContract(id)
    if (contract.status !== 'Vigente') throw new BadRequestException('Solo se pueden renovar contratos vigentes')
    const previousEnd = new Date(`${contract.endDate}T00:00:00`)
    const nextStart = previousEnd < today ? today : previousEnd
    const nextEnd = new Date(nextStart)
    nextEnd.setFullYear(nextEnd.getFullYear() + 1)
    contract.startDate = nextStart.toISOString().slice(0, 10)
    contract.endDate = nextEnd.toISOString().slice(0, 10)
    this.addLog(user, 'Renovó contrato', `Contrato #${id} renovado hasta ${contract.endDate}`)
    return contract
  }

  async terminateContract(id: number, user: AuthenticatedUser) {
    await this.requireManager(user)
    const contract = this.findContract(id)
    if (contract.status !== 'Vigente') throw new BadRequestException('El contrato ya está finalizado')
    contract.status = 'Terminado anticipadamente'
    contract.endDate = asDate(0)
    this.addLog(user, 'Terminó contrato anticipadamente', `Contrato #${id}`)
    return contract
  }

  private findContract(id: number) {
    const contract = this.contracts.find((item) => item.id === id)
    if (!contract) throw new NotFoundException('No se encontró el contrato')
    return contract
  }

  private finalizeExpiredContracts() {
    const now = new Date()
    for (const contract of this.contracts) {
      if (contract.status !== 'Vigente') continue
      const endDate = new Date(`${contract.endDate}T00:00:00`)
      const gracePeriodEnd = new Date(endDate)
      const originalDay = gracePeriodEnd.getDate()
      gracePeriodEnd.setDate(1)
      gracePeriodEnd.setMonth(gracePeriodEnd.getMonth() + 1)
      const lastDayOfGraceMonth = new Date(
        gracePeriodEnd.getFullYear(),
        gracePeriodEnd.getMonth() + 1,
        0,
      ).getDate()
      gracePeriodEnd.setDate(Math.min(originalDay, lastDayOfGraceMonth))
      if (now > gracePeriodEnd) contract.status = 'Terminado'
    }
  }

  async requireManager(user: AuthenticatedUser) {
    if (!managerRoles.includes(user.role)) throw new ForbiddenException('Se requiere rol Administrador o Jefe RRHH')
    await this.requireProfile(user)
  }

  async requireProfile(user: AuthenticatedUser) {
    const employee = user.source === 'db' ? await this.repository.employee(user.employeeId) : this.employees.find(item => item.id === user.employeeId)
    if (!employee?.profileComplete) throw new ForbiddenException('Completa tu perfil antes de continuar')
  }

  availableDays(id: number) {
    const employee = this.employees.find(item => item.id === id)
    return (employee?.vacationDays ?? 0) - this.requests.filter(item => item.employeeId === id && item.type === 'Vacaciones' && item.status !== 'Rechazada').reduce((sum, item) => sum + item.days, 0)
  }

  async createVacation(body: { employeeId: number; startDate: string; endDate: string }, user: AuthenticatedUser) {
    await this.requireProfile(user)
    if (body.employeeId !== user.employeeId) await this.requireManager(user)
    const days = businessDays(body.startDate, body.endDate)
    if (body.startDate < new Date().toISOString().slice(0, 10)) throw new BadRequestException('La fecha de inicio no puede estar en el pasado')
    if (!days) throw new BadRequestException('El rango debe tener días hábiles y no superar el saldo disponible')
    if (user.source === 'db') {
      const request = await this.repository.createVacation(body.employeeId, body.startDate, body.endDate, days)
      this.addLog(user, 'Solicitó vacaciones', `Solicitud #${request.id}, empleado #${body.employeeId}, ${days} días hábiles`)
      return request
    }
    const employee = this.employees.find(item => item.id === body.employeeId)
    if (!employee) throw new NotFoundException('Empleado no encontrado')
    if (days > this.availableDays(employee.id)) throw new BadRequestException('El rango debe tener días hábiles y no superar el saldo disponible')
    if (this.requests.some(item => item.employeeId === employee.id && item.status !== 'Rechazada' && item.startDate <= body.endDate && item.endDate >= body.startDate)) throw new BadRequestException('Existe una solicitud que se superpone con estas fechas')
    const request: AbsenceRequest = { id: Math.max(0, ...this.requests.map(item => item.id)) + 1, employeeId: employee.id, type: 'Vacaciones', startDate: body.startDate, endDate: body.endDate, days, reason: 'Solicitud de vacaciones', status: 'Pendiente' }
    this.requests.push(request)
    this.addLog(user, 'Solicitó vacaciones', `Solicitud #${request.id}, empleado #${employee.id}, ${days} días hábiles`)
    return request
  }

  // El correo lo registra RRHH al crear la cuenta (es el identificador de login), por eso no se pide aquí.
  async completeProfile(body: { phone: string; address: string; birthDate: string }, user: AuthenticatedUser) {
    const phone = text(body.phone, 'Teléfono', 30)
    const address = text(body.address, 'Dirección', 255)
    const birthDate = date(body.birthDate)
    if (birthDate >= new Date().toISOString().slice(0, 10)) throw new BadRequestException('Fecha de nacimiento inválida')
    if (user.source === 'db') {
      await this.repository.completeProfile(user.employeeId, { phone, address, birthDate })
    } else {
      const employee = this.employees.find(item => item.id === user.employeeId)
      if (!employee) throw new NotFoundException('Empleado no encontrado')
      Object.assign(employee, { phone, address, birthDate, profileComplete: true })
    }
    this.addLog(user, 'Completó perfil', `Empleado #${user.employeeId}`)
    return { employeeId: user.employeeId, profileComplete: true }
  }

  addLog(user: AuthenticatedUser, action: string, details: string) {
    this.logs.unshift({
      id: this.nextLogId++,
      userId: user.id,
      username: user.username,
      employeeId: user.employeeId,
      action,
      details,
      occurredAt: new Date().toISOString(),
    })
  }
}

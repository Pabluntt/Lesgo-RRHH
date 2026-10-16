import { BadRequestException, Injectable, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { AuthenticatedUser } from '../auth/auth.types'
import { AbsenceRequest, AuditLog, Employee, EmploymentContract } from './hr.types'

const today = new Date()
const asDate = (offsetDays: number) => {
  const date = new Date(today)
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

@Injectable()
export class HrService {
  // Datos de demostración en memoria: se reemplazarán por repositorios y BD.
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
    this.finalizeExpiredContracts()
    this.contractCheckTimer = setInterval(() => this.finalizeExpiredContracts(), 60_000)
  }

  onModuleDestroy() {
    if (this.contractCheckTimer) clearInterval(this.contractCheckTimer)
  }

  getDashboard(user: AuthenticatedUser) {
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
    return {
      employees,
      requests: this.requests,
      contracts: this.contracts,
      logs: this.logs,
      account: {
        ...user,
        employee: employees.find((employee) => employee.id === user.employeeId),
      },
    }
  }

  decideRequest(id: number, decision: 'Aprobada' | 'Rechazada', user: AuthenticatedUser, reason?: string) {
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

  renewContract(id: number, user: AuthenticatedUser) {
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

  terminateContract(id: number, user: AuthenticatedUser) {
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

  private addLog(user: AuthenticatedUser, action: string, details: string) {
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

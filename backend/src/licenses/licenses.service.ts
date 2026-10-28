import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { AuthenticatedUser } from '../auth/auth.types'
import { AuditService } from '../audit/audit.service'
import { asDate } from '../common/demo-dates'
import { LicenseRequest } from './licenses.types'

@Injectable()
export class LicensesService {
  constructor(private readonly auditService: AuditService) {}

  private readonly requests: LicenseRequest[] = [
    { id: 2, employeeId: 4, type: 'Licencia médica', startDate: asDate(1), endDate: asDate(3), days: 3, reason: 'Reposo médico', status: 'Pendiente' },
    { id: 3, employeeId: 5, type: 'Permiso', startDate: asDate(-8), endDate: asDate(-8), days: 1, reason: 'Trámite personal', status: 'Aprobada' },
  ]

  list() {
    return this.requests
  }

  findById(id: number) {
    return this.requests.find((item) => item.id === id)
  }

  decide(id: number, decision: 'Aprobada' | 'Rechazada', user: AuthenticatedUser, reason?: string) {
    if (decision !== 'Aprobada' && decision !== 'Rechazada') {
      throw new BadRequestException('La decisión debe ser Aprobada o Rechazada')
    }
    const request = this.findById(id)
    if (!request) throw new NotFoundException('No se encontró la solicitud')
    if (request.status !== 'Pendiente') throw new BadRequestException('La solicitud ya fue resuelta')
    request.status = decision
    this.auditService.addLog(user, `${decision} solicitud`, `Solicitud ${request.type} #${id}${reason ? `: ${reason}` : ''}`)
    return request
  }
}

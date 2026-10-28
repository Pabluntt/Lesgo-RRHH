import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { AuthenticatedUser } from '../auth/auth.types'
import { AuditService } from '../audit/audit.service'
import { asDate } from '../common/demo-dates'
import { VacationRequest } from './vacations.types'

@Injectable()
export class VacationsService {
  constructor(private readonly auditService: AuditService) {}

  private readonly requests: VacationRequest[] = [
    { id: 1, employeeId: 2, type: 'Vacaciones', startDate: asDate(12), endDate: asDate(19), days: 6, reason: 'Viaje familiar', status: 'Pendiente' },
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

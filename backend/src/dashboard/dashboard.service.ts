import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { AuditService } from '../audit/audit.service'
import { AuthenticatedUser } from '../auth/auth.types'
import { ContractsService } from '../contracts/contracts.service'
import { EmployeesService } from '../employees/employees.service'
import { LicensesService } from '../licenses/licenses.service'
import { VacationsService } from '../vacations/vacations.service'

@Injectable()
export class DashboardService {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly licensesService: LicensesService,
    private readonly vacationsService: VacationsService,
    private readonly contractsService: ContractsService,
    private readonly auditService: AuditService,
  ) {}

  getDashboard(user: AuthenticatedUser) {
    this.contractsService.finalizeExpiredContracts()
    const requests = [...this.vacationsService.list(), ...this.licensesService.list()].sort((a, b) => a.id - b.id)
    const employees = this.employeesService.withAttendance(requests)
    return {
      employees,
      requests,
      contracts: this.contractsService.list(),
      logs: this.auditService.list(),
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
    if (this.vacationsService.findById(id)) return this.vacationsService.decide(id, decision, user, reason)
    if (this.licensesService.findById(id)) return this.licensesService.decide(id, decision, user, reason)
    throw new NotFoundException('No se encontró la solicitud')
  }
}

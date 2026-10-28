import { BadRequestException, Injectable, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { AuthenticatedUser } from '../auth/auth.types'
import { AuditService } from '../audit/audit.service'
import { asDate, demoToday } from '../common/demo-dates'
import { EmploymentContract } from './contracts.types'

@Injectable()
export class ContractsService implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly auditService: AuditService) {}

  private readonly contracts: EmploymentContract[] = [
    { id: 1, employeeId: 2, startDate: asDate(-330), endDate: asDate(18), type: 'Plazo fijo', salary: 2450, status: 'Vigente' },
    { id: 2, employeeId: 3, startDate: asDate(-210), endDate: asDate(75), type: 'Indefinido', salary: 2800, status: 'Vigente' },
    { id: 3, employeeId: 4, startDate: asDate(-400), endDate: asDate(-12), type: 'Plazo fijo', salary: 2200, status: 'Vigente' },
    { id: 4, employeeId: 6, startDate: asDate(-150), endDate: asDate(150), type: 'Indefinido', salary: 2600, status: 'Vigente' },
  ]

  private contractCheckTimer?: NodeJS.Timeout

  onModuleInit() {
    this.finalizeExpiredContracts()
    this.contractCheckTimer = setInterval(() => this.finalizeExpiredContracts(), 60_000)
  }

  onModuleDestroy() {
    if (this.contractCheckTimer) clearInterval(this.contractCheckTimer)
  }

  list() {
    return this.contracts
  }

  renewContract(id: number, user: AuthenticatedUser) {
    const contract = this.findContract(id)
    if (contract.status !== 'Vigente') throw new BadRequestException('Solo se pueden renovar contratos vigentes')
    const previousEnd = new Date(`${contract.endDate}T00:00:00`)
    const nextStart = previousEnd < demoToday ? demoToday : previousEnd
    const nextEnd = new Date(nextStart)
    nextEnd.setFullYear(nextEnd.getFullYear() + 1)
    contract.startDate = nextStart.toISOString().slice(0, 10)
    contract.endDate = nextEnd.toISOString().slice(0, 10)
    this.auditService.addLog(user, 'Renovó contrato', `Contrato #${id} renovado hasta ${contract.endDate}`)
    return contract
  }

  terminateContract(id: number, user: AuthenticatedUser) {
    const contract = this.findContract(id)
    if (contract.status !== 'Vigente') throw new BadRequestException('El contrato ya está finalizado')
    contract.status = 'Terminado anticipadamente'
    contract.endDate = asDate(0)
    this.auditService.addLog(user, 'Terminó contrato anticipadamente', `Contrato #${id}`)
    return contract
  }

  finalizeExpiredContracts() {
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

  private findContract(id: number) {
    const contract = this.contracts.find((item) => item.id === id)
    if (!contract) throw new NotFoundException('No se encontró el contrato')
    return contract
  }
}

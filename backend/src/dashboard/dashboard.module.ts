import { Module } from '@nestjs/common'
import { AuditModule } from '../audit/audit.module'
import { AuthModule } from '../auth/auth.module'
import { ContractsModule } from '../contracts/contracts.module'
import { EmployeesModule } from '../employees/employees.module'
import { LicensesModule } from '../licenses/licenses.module'
import { VacationsModule } from '../vacations/vacations.module'
import { DashboardController } from './dashboard.controller'
import { DashboardService } from './dashboard.service'

@Module({
  imports: [AuthModule, EmployeesModule, LicensesModule, VacationsModule, ContractsModule, AuditModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}

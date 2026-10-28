import { Module } from '@nestjs/common'
import { AuditModule } from './audit/audit.module'
import { AuthModule } from './auth/auth.module'
import { ContractsModule } from './contracts/contracts.module'
import { DashboardModule } from './dashboard/dashboard.module'
import { EmployeesModule } from './employees/employees.module'
import { HealthModule } from './health/health.module'
import { LicensesModule } from './licenses/licenses.module'
import { TerminationsModule } from './terminations/terminations.module'
import { VacationsModule } from './vacations/vacations.module'

// Cada carpeta de src es un módulo de dominio. Dashboard solo junta la respuesta del panel.
@Module({
  imports: [
    AuthModule,
    HealthModule,
    EmployeesModule,
    LicensesModule,
    VacationsModule,
    ContractsModule,
    TerminationsModule,
    AuditModule,
    DashboardModule,
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common'
import { AuditModule } from '../audit/audit.module'
import { LicensesService } from './licenses.service'

@Module({
  imports: [AuditModule],
  providers: [LicensesService],
  exports: [LicensesService],
})
export class LicensesModule {}

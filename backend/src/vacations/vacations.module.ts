import { Module } from '@nestjs/common'
import { AuditModule } from '../audit/audit.module'
import { VacationsService } from './vacations.service'

@Module({
  imports: [AuditModule],
  providers: [VacationsService],
  exports: [VacationsService],
})
export class VacationsModule {}

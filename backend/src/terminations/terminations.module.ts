import { Module } from '@nestjs/common'
import { TerminationsService } from './terminations.service'

@Module({
  providers: [TerminationsService],
  exports: [TerminationsService],
})
export class TerminationsModule {}

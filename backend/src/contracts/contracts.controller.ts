import { Controller, Param, ParseIntPipe, Post, Request, UseGuards } from '@nestjs/common'
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ContractsService } from './contracts.service'

@UseGuards(JwtAuthGuard)
@Controller('hr/contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post(':id/renew')
  renewContract(@Param('id', ParseIntPipe) id: number, @Request() request: AuthenticatedRequest) {
    return this.contractsService.renewContract(id, request.user)
  }

  @Post(':id/terminate')
  terminateContract(@Param('id', ParseIntPipe) id: number, @Request() request: AuthenticatedRequest) {
    return this.contractsService.terminateContract(id, request.user)
  }
}

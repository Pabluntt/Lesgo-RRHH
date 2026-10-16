import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards, Request } from '@nestjs/common'
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard'
import { HrService } from './hr.service'

@UseGuards(JwtAuthGuard)
@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get('dashboard')
  getDashboard(@Request() request: AuthenticatedRequest) {
    return this.hrService.getDashboard(request.user)
  }

  @Post('requests/:id/decision')
  decideRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { decision: 'Aprobada' | 'Rechazada'; reason?: string },
    @Request() request: AuthenticatedRequest,
  ) {
    return this.hrService.decideRequest(id, body.decision, request.user, body.reason)
  }

  @Post('contracts/:id/renew')
  renewContract(@Param('id', ParseIntPipe) id: number, @Request() request: AuthenticatedRequest) {
    return this.hrService.renewContract(id, request.user)
  }

  @Post('contracts/:id/terminate')
  terminateContract(@Param('id', ParseIntPipe) id: number, @Request() request: AuthenticatedRequest) {
    return this.hrService.terminateContract(id, request.user)
  }
}

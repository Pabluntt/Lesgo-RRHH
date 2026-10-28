import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards, Request } from '@nestjs/common'
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard'
import { HrService } from './hr.service'
import { AuthService } from '../auth/auth.service'

@UseGuards(JwtAuthGuard)
@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService, private readonly auth: AuthService) {}

  @Post('users')
  createUser(@Body() body: Parameters<AuthService['createUser']>[0], @Request() request: AuthenticatedRequest) {
    return this.auth.createUser(body, request.user)
  }

  @Post('profile')
  profile(@Body() body: Parameters<HrService['completeProfile']>[0], @Request() request: AuthenticatedRequest) {
    return this.hrService.completeProfile(body, request.user)
  }

  @Post('vacations')
  vacation(@Body() body: Parameters<HrService['createVacation']>[0], @Request() request: AuthenticatedRequest) {
    return this.hrService.createVacation(body, request.user)
  }

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

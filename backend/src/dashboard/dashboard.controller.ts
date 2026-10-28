import { Body, Controller, Get, Param, ParseIntPipe, Post, Request, UseGuards } from '@nestjs/common'
import { AuthenticatedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard'
import { DashboardService } from './dashboard.service'

@UseGuards(JwtAuthGuard)
@Controller('hr')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('dashboard')
  getDashboard(@Request() request: AuthenticatedRequest) {
    return this.dashboardService.getDashboard(request.user)
  }

  @Post('requests/:id/decision')
  decideRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { decision: 'Aprobada' | 'Rechazada'; reason?: string },
    @Request() request: AuthenticatedRequest,
  ) {
    return this.dashboardService.decideRequest(id, body.decision, request.user, body.reason)
  }
}

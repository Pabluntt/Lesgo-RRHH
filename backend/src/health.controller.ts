import { Controller, Get } from '@nestjs/common'

@Controller()
export class HealthController {
  @Get()
  getStatus() {
    return { name: 'Lesgo RRHH API', status: 'ok' }
  }
}

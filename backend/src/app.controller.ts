import { Controller, Get } from '@nestjs/common'

@Controller()
export class AppController {
  @Get()
  getStatus() {
    return {
      name: 'Lesgo RRHH API',
      status: 'ok',
    }
  }
}

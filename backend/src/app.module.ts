import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { AuthController } from './auth/auth.controller'
import { AuthService } from './auth/auth.service'
import { JwtAuthGuard } from './auth/jwt-auth.guard'
import { HrController } from './hr/hr.controller'
import { HrService } from './hr/hr.service'
import { HealthController } from './health.controller'

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'lesgo-rrhh-demo-secret-change-me',
      signOptions: { expiresIn: '8h' },
    }),
  ],
  controllers: [HealthController, AuthController, HrController],
  providers: [AuthService, HrService, JwtAuthGuard],
})
export class AppModule {}

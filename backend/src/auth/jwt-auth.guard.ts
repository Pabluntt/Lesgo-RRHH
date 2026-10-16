import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Request } from 'express'
import { AuthService } from './auth.service'
import { AuthenticatedUser } from './auth.types'

export type AuthenticatedRequest = Request & { user: AuthenticatedUser }

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const authorization = request.headers.authorization
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Se requiere iniciar sesión')
    }
    request.user = await this.authService.verifyToken(authorization.slice(7))
    return true
  }
}

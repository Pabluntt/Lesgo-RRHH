import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { AuthenticatedUser, DemoUser } from './auth.types'

// Simulación de la tabla de usuarios del ERP; employeeId enlaza con empleado.
const demoUsers: DemoUser[] = [
  {
    id: 1,
    username: 'admin',
    passwordHash: bcrypt.hashSync('admin123', 10),
    role: 'Administrador',
    employeeId: 1,
  },
]

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(username: string, password: string) {
    const account = demoUsers.find((user) => user.username === username)
    if (!account || !(await bcrypt.compare(password, account.passwordHash))) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos')
    }

    const user: AuthenticatedUser = {
      id: account.id,
      username: account.username,
      role: account.role,
      employeeId: account.employeeId,
    }
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      username: user.username,
      role: user.role,
      employeeId: user.employeeId,
    })

    return { accessToken, user }
  }

  async verifyToken(token: string): Promise<AuthenticatedUser> {
    try {
      const payload = await this.jwtService.verifyAsync(token)
      const account = demoUsers.find((user) => user.id === payload.sub)
      if (!account) throw new Error('Unknown user')
      return {
        id: account.id,
        username: account.username,
        role: account.role,
        employeeId: account.employeeId,
      }
    } catch {
      throw new UnauthorizedException('Sesión inválida o expirada')
    }
  }
}

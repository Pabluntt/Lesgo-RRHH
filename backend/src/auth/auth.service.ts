import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common'
import { HrService } from '../hr/hr.service'
import { text } from '../hr/validation'
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
  constructor(private readonly jwtService: JwtService, private readonly hr: HrService) {}

  createUser(body: { username: string; password: string; name: string; rut: string; role: string }, actor: AuthenticatedUser) {
    this.hr.requireManager(actor)
    const username = text(body.username, 'Usuario', 50).toLowerCase()
    if (!/^[a-z0-9._-]+$/.test(username)) throw new BadRequestException('Usuario: utiliza letras, números, puntos o guiones')
    if (demoUsers.some(item => item.username === username)) throw new BadRequestException('El usuario ya existe')
    if (typeof body.password !== 'string' || body.password.length < 8 || Buffer.byteLength(body.password) > 72) throw new BadRequestException('Contraseña: mínimo 8 caracteres y máximo 72 bytes')
    const passwordHash = bcrypt.hashSync(body.password, 10)
    const employee = this.hr.createEmployee(body)
    const user = { id: employee.id, employeeId: employee.id, username, role: body.role }
    demoUsers.push({ ...user, passwordHash })
    this.hr.addLog(actor, 'Creó usuario', `Usuario ${username}, empleado #${employee.id}, rol ${body.role}`)
    return user
  }

  async login(username: string, password: string) {
    if (typeof username !== 'string' || typeof password !== 'string') throw new UnauthorizedException('Credenciales inválidas')
    const account = demoUsers.find((user) => user.username === username.trim().toLowerCase())
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

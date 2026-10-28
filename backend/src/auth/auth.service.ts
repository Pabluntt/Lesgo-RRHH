import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common'
import { HrService } from '../hr/hr.service'
import { HrRepository } from '../hr/hr.repository'
import { email, rut, text } from '../hr/validation'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { AuthenticatedUser, DemoUser } from './auth.types'

// Administrador de prueba en memoria; las cuentas creadas desde el formulario viven en rrhh.usuario.
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
  constructor(private readonly jwtService: JwtService, private readonly hr: HrService, private readonly repository: HrRepository) {}

  async createUser(body: { email: string; password: string; name: string; surname: string; rut: string; role: string }, actor: AuthenticatedUser) {
    await this.hr.requireManager(actor)
    const data = { email: email(body.email), name: text(body.name, 'Nombre'), surname: text(body.surname, 'Apellido'), rut: rut(body.rut), role: text(body.role, 'Rol') }
    if (typeof body.password !== 'string' || body.password.length < 8 || Buffer.byteLength(body.password) > 72) throw new BadRequestException('Contraseña: mínimo 8 caracteres y máximo 72 bytes')
    const passwordHash = await bcrypt.hash(body.password, 10)
    // El admin de prueba no existe en rrhh.empleado, así que la auditoría queda sin actor.
    const employeeId = await this.repository.createUser({ ...data, passwordHash }, actor.source === 'db' ? actor.employeeId : null)
    this.hr.addLog(actor, 'Creó usuario', `Usuario ${data.email}, empleado #${employeeId}, rol ${data.role}`)
    return { id: employeeId, employeeId, username: data.email, role: data.role }
  }

  async login(username: string, password: string) {
    if (typeof username !== 'string' || typeof password !== 'string') throw new UnauthorizedException('Credenciales inválidas')
    const identifier = username.trim().toLowerCase()
    const user = identifier.includes('@') ? await this.loginDatabase(identifier, password) : await this.loginDemo(identifier, password)
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      username: user.username,
      role: user.role,
      employeeId: user.employeeId,
      source: user.source,
    })

    return { accessToken, user }
  }

  private async loginDemo(username: string, password: string): Promise<AuthenticatedUser> {
    const account = demoUsers.find((user) => user.username === username)
    if (!account || !(await bcrypt.compare(password, account.passwordHash))) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos')
    }
    return { id: account.id, username: account.username, role: account.role, employeeId: account.employeeId, source: 'demo' }
  }

  private async loginDatabase(email: string, password: string): Promise<AuthenticatedUser> {
    const account = await this.repository.findLogin(email)
    if (!account || !(await bcrypt.compare(password, account.password_hash))) {
      if (account) await this.repository.recordLogin(account.id_empleado, false)
      throw new UnauthorizedException('Usuario o contraseña incorrectos')
    }
    if (account.estado !== 'activo') throw new UnauthorizedException('La cuenta no está activa')
    await this.repository.recordLogin(account.id_empleado, true)
    return { id: account.id_empleado, username: email, role: account.rol ?? 'Sin rol', employeeId: account.id_empleado, source: 'db' }
  }

  async verifyToken(token: string): Promise<AuthenticatedUser> {
    let payload: { sub: number; source?: string }
    try {
      payload = await this.jwtService.verifyAsync(token)
    } catch {
      throw new UnauthorizedException('Sesión inválida o expirada')
    }
    if (payload.source === 'db') {
      // Se relee la cuenta para reflejar bloqueos o cambios de rol hechos en la BD.
      const account = await this.repository.findAccount(payload.sub)
      if (!account || account.estado !== 'activo') throw new UnauthorizedException('Sesión inválida o expirada')
      return { id: payload.sub, username: account.email, role: account.rol ?? 'Sin rol', employeeId: payload.sub, source: 'db' }
    }
    const account = demoUsers.find((user) => user.id === payload.sub)
    if (!account) throw new UnauthorizedException('Sesión inválida o expirada')
    return { id: account.id, username: account.username, role: account.role, employeeId: account.employeeId, source: 'demo' }
  }
}

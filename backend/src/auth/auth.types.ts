export interface DemoUser {
  id: number
  username: string
  passwordHash: string
  role: string
  employeeId: number
}

export interface AuthenticatedUser {
  id: number
  username: string
  role: string
  employeeId: number
  // 'demo': cuenta en memoria (admin de prueba); 'db': cuenta en rrhh.usuario.
  source: 'demo' | 'db'
}

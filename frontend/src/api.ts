const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export interface SessionUser {
  id: number
  username: string
  role: string
  employeeId: number
}

export interface Employee {
  rut?: string
  vacationDays?: number
  profileComplete?: boolean
  id: number
  name: string
  email: string
  department: string
  jobTitle: string
  role: string
  status: 'Presente' | 'Ausente' | 'Remoto'
}

export interface AbsenceRequest {
  id: number
  employeeId: number
  type: 'Vacaciones' | 'Licencia médica' | 'Permiso'
  startDate: string
  endDate: string
  days: number
  reason: string
  status: 'Pendiente' | 'Aprobada' | 'Rechazada'
}

export interface EmploymentContract {
  id: number
  employeeId: number
  startDate: string
  endDate: string
  type: string
  salary: number
  status: 'Vigente' | 'Terminado' | 'Terminado anticipadamente'
}

export interface AuditLog {
  id: number
  userId: number
  username: string
  employeeId: number
  action: string
  details: string
  occurredAt: string
}

export interface DashboardData {
  roles: string[]
  employees: Employee[]
  requests: AbsenceRequest[]
  contracts: EmploymentContract[]
  logs: AuditLog[]
  account: SessionUser & { employee?: Employee }
}

export async function request<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new Error(payload?.message ?? 'No se pudo completar la operación')
  }
  return response.json() as Promise<T>
}

export async function login(username: string, password: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new Error(payload?.message ?? 'Usuario o contraseña incorrectos')
  }
  return response.json() as Promise<{ accessToken: string; user: SessionUser }>
}

export const getDashboard = (token: string) => request<DashboardData>('/hr/dashboard', token)

export const decideRequest = (token: string, id: number, decision: 'Aprobada' | 'Rechazada') =>
  request<AbsenceRequest>(`/hr/requests/${id}/decision`, token, {
    method: 'POST',
    body: JSON.stringify({ decision }),
  })

export const renewContract = (token: string, id: number) =>
  request<EmploymentContract>(`/hr/contracts/${id}/renew`, token, { method: 'POST' })

export const terminateContract = (token: string, id: number) =>
  request<EmploymentContract>(`/hr/contracts/${id}/terminate`, token, { method: 'POST' })

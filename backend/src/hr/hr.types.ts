export interface Employee {
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

export interface Employee {
  rut?: string
  vacationDays?: number
  profileComplete?: boolean
  surname?: string
  birthDate?: string
  phone?: string
  address?: string
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
  // Nombre de tipo_ausencia; 'Vacaciones' se trata aparte del resto de licencias y permisos.
  type: string
  startDate: string
  endDate: string
  days: number
  reason: string
  status: 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Cancelada' | 'En curso' | 'Finalizada'
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

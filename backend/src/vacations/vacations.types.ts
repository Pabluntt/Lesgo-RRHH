export interface VacationRequest {
  id: number
  employeeId: number
  type: 'Vacaciones'
  startDate: string
  endDate: string
  days: number
  reason: string
  status: 'Pendiente' | 'Aprobada' | 'Rechazada'
}

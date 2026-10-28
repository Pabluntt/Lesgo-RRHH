export interface LicenseRequest {
  id: number
  employeeId: number
  type: 'Licencia médica' | 'Permiso'
  startDate: string
  endDate: string
  days: number
  reason: string
  status: 'Pendiente' | 'Aprobada' | 'Rechazada'
}

export interface EmploymentContract {
  id: number
  employeeId: number
  startDate: string
  endDate: string
  type: string
  salary: number
  status: 'Vigente' | 'Terminado' | 'Terminado anticipadamente'
}

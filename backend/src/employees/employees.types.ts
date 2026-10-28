export interface Employee {
  id: number
  name: string
  email: string
  department: string
  jobTitle: string
  role: string
  status: 'Presente' | 'Ausente' | 'Remoto'
}

import { Injectable } from '@nestjs/common'
import { asDate } from '../common/demo-dates'
import { Employee } from './employees.types'

@Injectable()
export class EmployeesService {
  private readonly employees: Employee[] = [
    { id: 1, name: 'Alexandra Reyes', email: 'admin@lesgo.test', department: 'Recursos Humanos', jobTitle: 'Administradora', role: 'Administración', status: 'Presente' },
    { id: 2, name: 'Mateo Silva', email: 'mateo@lesgo.test', department: 'Tecnología', jobTitle: 'Desarrollador', role: 'Tecnología', status: 'Presente' },
    { id: 3, name: 'Camila Torres', email: 'camila@lesgo.test', department: 'Tecnología', jobTitle: 'Diseñadora UX', role: 'Tecnología', status: 'Remoto' },
    { id: 4, name: 'Diego Herrera', email: 'diego@lesgo.test', department: 'Operaciones', jobTitle: 'Analista', role: 'Operaciones', status: 'Presente' },
    { id: 5, name: 'Valentina Cruz', email: 'valentina@lesgo.test', department: 'Operaciones', jobTitle: 'Coordinadora', role: 'Operaciones', status: 'Ausente' },
    { id: 6, name: 'Sofía Méndez', email: 'sofia@lesgo.test', department: 'Recursos Humanos', jobTitle: 'People Partner', role: 'Recursos Humanos', status: 'Presente' },
  ]

  list() {
    return this.employees
  }

  withAttendance(absences: Array<{ employeeId: number; status: string; startDate: string; endDate: string }>) {
    const today = asDate(0)
    return this.employees.map((employee) => {
      const approvedAbsence = absences.some((request) =>
        request.employeeId === employee.id
        && request.status === 'Aprobada'
        && request.startDate <= today
        && request.endDate >= today,
      )
      return approvedAbsence ? { ...employee, status: 'Ausente' as const } : employee
    })
  }
}

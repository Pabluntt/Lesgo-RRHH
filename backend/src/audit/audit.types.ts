export interface AuditLog {
  id: number
  userId: number
  username: string
  employeeId: number
  action: string
  details: string
  occurredAt: string
}

import { Injectable } from '@nestjs/common'
import { AuthenticatedUser } from '../auth/auth.types'
import { AuditLog } from './audit.types'

@Injectable()
export class AuditService {
  private readonly logs: AuditLog[] = []
  private nextLogId = 1

  list() {
    return this.logs
  }

  addLog(user: AuthenticatedUser, action: string, details: string) {
    this.logs.unshift({
      id: this.nextLogId++,
      userId: user.id,
      username: user.username,
      employeeId: user.employeeId,
      action,
      details,
      occurredAt: new Date().toISOString(),
    })
  }
}

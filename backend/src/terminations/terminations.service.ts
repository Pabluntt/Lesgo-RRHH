import { Injectable } from '@nestjs/common'

@Injectable()
export class TerminationsService {
  // El MER todavía no define la entidad de desvinculación.
  list() {
    return []
  }
}

import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { Pool, PoolClient, QueryResultRow, types } from 'pg'

// DATE como texto 'YYYY-MM-DD' para evitar desfases de zona horaria al convertir a Date.
types.setTypeParser(types.builtins.DATE, value => value)

// Conexión a PostgreSQL (Neon). Usa las variables estándar PGHOST, PGDATABASE, PGUSER y PGPASSWORD.
@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool = new Pool({
    ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: true },
    max: 5,
  })

  async query<T extends QueryResultRow>(sql: string, params: unknown[] = []) {
    return (await this.pool.query<T>(sql, params)).rows
  }

  async transaction<T>(work: (client: PoolClient) => Promise<T>) {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      const result = await work(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  onModuleDestroy() {
    return this.pool.end()
  }
}

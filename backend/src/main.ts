import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors({ origin: ['http://localhost:5173', 'http://localhost:8080'] })

  const port = process.env.PORT ?? 3000
  await app.listen(port)
  console.log(`Backend disponible en http://localhost:${port}`)
}

void bootstrap()

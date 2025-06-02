import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: true, // Allow all origins
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Accept'],
      credentials: true,
    },
  });
  
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Noone API')
    .setDescription('Mock API for Noone corporate gifting — order creation, invoice data, and receipts')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  const swaggerCdn = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14';
  SwaggerModule.setup('api', app, document, {
    customCssUrl: `${swaggerCdn}/swagger-ui.css`,
    customJs: [
      `${swaggerCdn}/swagger-ui-bundle.js`,
      `${swaggerCdn}/swagger-ui-standalone-preset.js`,
    ],
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`Swagger UI available at http://localhost:${port}/api`);
}
bootstrap();

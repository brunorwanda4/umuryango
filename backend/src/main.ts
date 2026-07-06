import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { networkInterfaces } from 'node:os';
import { AppModule } from './app.module';
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from './auth/auth.constants';

function getLanIpv4Addresses() {
  return Object.values(networkInterfaces())
    .flatMap((interfaces) => interfaces ?? [])
    .filter((netInterface) => {
      return netInterface.family === 'IPv4' && !netInterface.internal;
    })
    .map((netInterface) => netInterface.address);
}

function parseCorsOrigins() {
  const configuredOrigins = process.env.CORS_ORIGINS;

  if (configuredOrigins) {
    return configuredOrigins
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  return [
    process.env.FRONTEND_URL ?? 'http://localhost:4914',
    'http://127.0.0.1:4914',
    'http://localhost:4974',
    'http://127.0.0.1:4974',
  ];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: parseCorsOrigins(),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Rwanda Family API')
    .setDescription(
      'Versioned REST API for Rwanda Family authentication and family management workflows.',
    )
    .setVersion('1.0')
    .addTag('auth', 'Authentication and account verification')
    .addTag('families', 'Family workspace creation and membership')
    .addTag('contributions', 'Family contribution plans, cycles, and payments')
    .addTag(
      'projects',
      'Family project plans, budgets, contributions, and updates',
    )
    .addCookieAuth(ACCESS_COOKIE_NAME, undefined, ACCESS_COOKIE_NAME)
    .addCookieAuth(REFRESH_COOKIE_NAME, undefined, REFRESH_COOKIE_NAME)
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('/', app, swaggerDocument, {
    customSiteTitle: 'Rwanda Family API Docs',
    customCssUrl:
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.32.6/swagger-ui.css',
    customJs: [
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.32.6/swagger-ui-bundle.js',
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.32.6/swagger-ui-standalone-preset.js',
    ],
    jsonDocumentUrl: 'docs-json',
    yamlDocumentUrl: 'docs-yaml',
  });

  const port = process.env.PORT ?? 4915;
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);
  console.log(`Swagger UI: http://localhost:${port}/`);

  for (const lanIpAddress of getLanIpv4Addresses()) {
    console.log(`Network API: http://${lanIpAddress}:${port}/`);
  }
}
void bootstrap();

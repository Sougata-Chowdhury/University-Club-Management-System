import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    
    // Enable CORS for frontend communication
    const allowedOrigins = [
      process.env.CORS_ORIGIN,
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'https://university-club-management-system.vercel.app',
      'https://university-club-management-system-mtxfpdgm6.vercel.app'
    ].filter(Boolean);

    app.enableCors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    });
    
    const port = process.env.PORT || process.env.BACKEND_PORT || 8000;
    console.log(`Attempting to bind to port ${port} on all interfaces...`);
    
    const server = await app.listen(port, '0.0.0.0');
    console.log(`Backend running on http://localhost:${port} - Fixed`);  
    console.log(`Also accessible on http://0.0.0.0:${port}`);
    console.log(`Server object:`, !!server);
    
    // Test if server is actually listening
    const address = server.address();
    console.log(`Server address:`, address);
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}
bootstrap();

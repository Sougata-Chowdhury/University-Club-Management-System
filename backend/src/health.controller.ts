import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private connection: Connection) {}

  @Get()
  async getHealth() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: this.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      dbName: this.connection.name,
    };
  }
}

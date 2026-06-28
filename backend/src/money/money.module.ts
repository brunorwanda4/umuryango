import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MoneyController } from './money.controller';
import { MoneyService } from './money.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [MoneyController],
  providers: [MoneyService],
})
export class MoneyModule {}

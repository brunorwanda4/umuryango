import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PersonalPlansController } from './personal-plans.controller';
import { PersonalPlansService } from './personal-plans.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PersonalPlansController],
  providers: [PersonalPlansService],
})
export class PersonalPlansModule {}

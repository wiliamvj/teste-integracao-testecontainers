import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import {
  UserRepository,
  UserContractRepository,
} from './repositories/user.repository';
import { UserService } from './user.service';
import { PrismaService } from './database/prisma/prisma.service';

@Module({
  imports: [],
  controllers: [UserController],
  providers: [
    UserService,
    PrismaService,
    {
      provide: UserContractRepository,
      useClass: UserRepository,
    },
  ],
})
export class AppModule {}

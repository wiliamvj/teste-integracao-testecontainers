import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { UserDto, UserUpdateDto } from '../dto/user.dto';
import { User } from '@prisma/client';

export abstract class UserContractRepository {
  abstract create(user: UserDto): Promise<void>;
  abstract findByEmail(email: string): Promise<boolean>;
  abstract findUserById(id: string): Promise<Partial<User>>;
  abstract findById(id: string): Promise<boolean>;
  abstract updateUser(id: string, user: UserUpdateDto): Promise<void>;
}

@Injectable()
export class UserRepository implements UserContractRepository {
  constructor(private prisma: PrismaService) {}

  async create(user: UserDto): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.user.create({
        data: {
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          password: user.password,
        },
      }),
    ]);
  }

  async findByEmail(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    return !!user;
  }

  async findUserById(id: string): Promise<Partial<User>> {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        created_at: true,
      },
    });
  }

  async findById(id: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });
    return !!user;
  }

  async updateUser(id: string, user: UserUpdateDto): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: {
          id,
        },
        data: {
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
        },
      }),
    ]);
  }
}

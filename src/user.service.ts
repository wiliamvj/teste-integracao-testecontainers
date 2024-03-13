import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hash } from 'bcrypt';
import { UserDto, UserUpdateDto } from './dto/user.dto';
import { UserContractRepository } from './repositories/user.repository';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private repository: UserContractRepository) {}

  async create(user: UserDto): Promise<void> {
    const userExists = await this.repository.findByEmail(user.email);
    if (userExists) throw new BadRequestException('user already exists');

    const passwordHashed = await hash(user.password, 10);
    await this.repository.create({ ...user, password: passwordHashed });
  }

  async findUserById(id: string): Promise<Partial<User>> {
    return this.repository.findUserById(id);
  }

  async updateUser(id: string, user: UserUpdateDto): Promise<void> {
    const userExists = await this.repository.findById(id);
    if (!userExists) throw new NotFoundException('user not found');

    if (user.email) {
      const userExists = await this.repository.findByEmail(user.email);
      if (userExists) throw new BadRequestException('email already exists');
    }
    await this.repository.updateUser(id, user);
  }
}

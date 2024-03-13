import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { UserDto, UserIdParamDto, UserUpdateDto } from './dto/user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Post()
  create(@Body() body: UserDto) {
    return this.service.create(body);
  }

  @Get(':id')
  findUserById(@Param() { id }: UserIdParamDto) {
    return this.service.findUserById(id);
  }

  @Patch(':id')
  updateUser(@Param() { id }: UserIdParamDto, @Body() body: UserUpdateDto) {
    return this.service.updateUser(id, body);
  }
}

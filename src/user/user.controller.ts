import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('api')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('register')
  register(@Body() user: any) {
    if (user.password !== user.confirm_password) {
      throw new BadRequestException('Passwords do not match');
    }
    return user;
  }
}

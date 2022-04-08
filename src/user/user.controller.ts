import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import bcrypt from 'bcryptjs';

@Controller('api')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('register')
  async register(@Body() user: any) {
    if (user.password !== user.confirm_password) {
      throw new BadRequestException('Passwords do not match');
    }
    return this.userService.save({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      password: await bcrypt.hash(user.password, 12),
    });
  }

  @Post('login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    const user = await this.userService.findOne({ email });
    if (!user) {
      return new BadRequestException('Invalid credentials');
    }
    if (await bcrypt.compare(password, user.password)) {
      return new BadRequestException('Invalid credentials');
    }
    return user;
  }
}

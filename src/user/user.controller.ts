import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Res,
} from '@nestjs/common';
import { UserService } from './user.service';
import bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';

@Controller()
export class UserController {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

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
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.userService.findOne({ email });
    if (!user) {
      return new BadRequestException('Invalid credentials');
    }
    if (await bcrypt.compare(password, user.password)) {
      return new BadRequestException('Invalid credentials');
    }
    const accessToken = this.jwtService.signAsync(
      { id: user.id },
      { expiresIn: '60s' },
    );
    const refreshToken = this.jwtService.signAsync({ id: user.id });
    response.cookie('access_token', accessToken, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
    return {
      token: accessToken,
    };
  }
}

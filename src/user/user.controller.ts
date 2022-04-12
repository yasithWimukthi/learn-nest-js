import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { UserService } from './user.service';
import bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';

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
    response.status(200);
    response.cookie('access_token', accessToken, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
    return {
      token: accessToken,
    };
  }

  @Get('user')
  async getUser(@Req() request: Request) {
    try {
      const accessToken = request.headers.authorization.split(' ')[1];
      const { id } = await this.jwtService.verifyAsync(accessToken);
      const { password, ...data } = await this.userService.findOne({ id });
    } catch (e) {
      return new BadRequestException('Invalid credentials');
    }
  }

  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const refreshToken = request.cookies['refresh_token'];
      const { id } = await this.jwtService.verifyAsync(refreshToken);
      const accessToken = this.jwtService.signAsync({ id });
      response.status(200);
      return {
        token: accessToken,
      };
    } catch (e) {
      return new BadRequestException('Invalid credentials');
    }
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('access_token');
    response.status(200);
    return {
      message: 'Logged out successfully',
    };
  }
}

import { Body, Controller, Post } from '@nestjs/common';
import { ResetService } from './reset.service';
import { MailerService } from '@nestjs-modules/mailer';

@Controller('reset')
export class ResetController {
  constructor(
    private resetService: ResetService,
    private mailerService: MailerService,
  ) {}

  @Post('forgot')
  async forgot(@Body('email') email: string) {
    const token = Math.random().toString(20).substring(2, 12);
    await this.resetService.save({ email, token });
    const url = `http://localhost:3000/reset/${token}`;
    await this.mailerService.sendMail({
      to: email,
      subject: 'Reset password',
      html: `<a href="${url}">Reset password</a>`,
    });
    return {
      message: 'Check your email for reset link',
    };
  }
}

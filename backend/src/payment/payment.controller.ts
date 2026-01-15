import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PaymentService } from './payment.service';
import { CreatePaymentDto, UpdatePaymentDto, ApprovePaymentDto } from '../dto/payment.dto';
import { AuthGuard } from '../guards/auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('proofOfPayment', {
    storage: diskStorage({
      destination: './uploads/payments',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `payment-proof-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|pdf)$/)) {
        return cb(new BadRequestException('Only image and PDF files are allowed'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
  }))
  async createPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @UploadedFile() file: any,
    @Request() req
  ) {
    if (file) {
      createPaymentDto.proofOfPayment = `/uploads/payments/${file.filename}`;
    }
    
    return this.paymentService.createPayment(createPaymentDto, req.user.userId);
  }

  @Get('my-payments')
  @UseGuards(AuthGuard)
  async getUserPayments(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    return this.paymentService.getUserPayments(req.user.userId, pageNum, limitNum);
  }

  @Get('club/:clubId')
  @UseGuards(AuthGuard)
  async getClubPayments(
    @Param('clubId') clubId: string,
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    return this.paymentService.getClubPayments(clubId, req.user.userId, pageNum, limitNum);
  }

  @Get('club/:clubId/history')
  @UseGuards(AuthGuard)
  async getClubPaymentHistory(
    @Param('clubId') clubId: string,
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    return this.paymentService.getClubPaymentHistory(clubId, req.user.userId, pageNum, limitNum);
  }

  @Get('event/:eventId')
  @UseGuards(AuthGuard)
  async getEventPayments(
    @Param('eventId') eventId: string,
    @Request() req
  ) {
    return this.paymentService.getEventPayments(eventId, req.user.userId);
  }

  @Get('stats')
  @UseGuards(AuthGuard)
  async getPaymentStats(@Request() req) {
    return this.paymentService.getPaymentStats(req.user.userId);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async getPaymentById(@Param('id') id: string, @Request() req) {
    return this.paymentService.getPaymentById(id, req.user.userId);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('proofOfPayment', {
    storage: diskStorage({
      destination: './uploads/payments',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `payment-proof-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|pdf)$/)) {
        return cb(new BadRequestException('Only image and PDF files are allowed'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
  }))
  async updatePayment(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
    @UploadedFile() file: any,
    @Request() req
  ) {
    if (file) {
      updatePaymentDto.proofOfPayment = `/uploads/payments/${file.filename}`;
    }
    
    return this.paymentService.updatePayment(id, updatePaymentDto, req.user.userId);
  }

  @Put(':id/approve')
  @UseGuards(AuthGuard)
  async approvePayment(
    @Param('id') id: string,
    @Body() approvePaymentDto: ApprovePaymentDto,
    @Request() req
  ) {
    return this.paymentService.approvePayment(id, approvePaymentDto, req.user.userId);
  }
}

import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsMongoId, Min } from 'class-validator';
import { PaymentMethod, PaymentStatus } from '../schemas/payment.schema';

export class CreatePaymentDto {
  @IsMongoId({ message: 'Invalid event ID' })
  eventId: string;

  @IsEnum(PaymentMethod, { message: 'Invalid payment method' })
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  proofOfPayment?: string;
}

export class UpdatePaymentDto {
  @IsOptional()
  @IsEnum(PaymentStatus, { message: 'Invalid payment status' })
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  proofOfPayment?: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class ApprovePaymentDto {
  @IsEnum(PaymentStatus, { message: 'Status must be approved or rejected' })
  status: PaymentStatus.APPROVED | PaymentStatus.REJECTED;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

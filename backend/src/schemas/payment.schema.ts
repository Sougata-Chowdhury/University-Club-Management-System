import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './user.schema';
import { Event } from './event.schema';
import { Club } from './club.schema';

export type PaymentDocument = Payment & Document;

export enum PaymentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REFUNDED = 'refunded'
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  DIGITAL_WALLET = 'digital_wallet',
  OTHER = 'other'
}

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Event', required: true })
  eventId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Club', required: true })
  clubId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ default: 'USD' })
  currency: string;

  @Prop({ 
    type: String, 
    enum: Object.values(PaymentStatus), 
    default: PaymentStatus.PENDING 
  })
  status: PaymentStatus;

  @Prop({ 
    type: String, 
    enum: Object.values(PaymentMethod), 
    required: true 
  })
  paymentMethod: PaymentMethod;

  @Prop({ default: null })
  transactionId: string;

  @Prop({ default: null })
  notes: string;

  @Prop({ default: null })
  proofOfPayment: string; // File path for payment proof image

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  approvedBy: Types.ObjectId;

  @Prop({ default: null })
  approvedAt: Date;

  @Prop({ default: null })
  rejectionReason: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Add indexes for better query performance
PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ eventId: 1, status: 1 });
PaymentSchema.index({ clubId: 1, status: 1 });
PaymentSchema.index({ status: 1, createdAt: -1 });

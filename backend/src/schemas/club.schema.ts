import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ClubDocument = Club & Document;

@Schema({ timestamps: true })
export class Club {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  category: string;

  @Prop()
  logoUrl?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ default: 'pending', enum: ['pending', 'approved', 'rejected'] })
  status: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  members: Types.ObjectId[];

  @Prop({ 
    type: [{
      _id: { type: Types.ObjectId, auto: true },
      userId: { type: Types.ObjectId, ref: 'User' },
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
      appliedAt: { type: Date, default: Date.now }
    }]
  })
  memberApplications: Array<{
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    status: string;
    appliedAt: Date;
  }>;

  @Prop()
  meetingTime?: string;

  @Prop()
  location?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  maxMembers?: number;

  @Prop([String])
  tags: string[];

  @Prop()
  contactEmail?: string;

  @Prop({ type: Date })
  approvedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId;
}

export const ClubSchema = SchemaFactory.createForClass(Club);

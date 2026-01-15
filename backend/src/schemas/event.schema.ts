import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EventDocument = Event & Document;

@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  location: string;

  @Prop({ type: Types.ObjectId, ref: 'Club', required: true })
  clubId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  maxAttendees: number;

  @Prop([{ type: Types.ObjectId, ref: 'User' }])
  attendees: Types.ObjectId[];

  @Prop({ default: false })
  isPaid: boolean;

  @Prop({ default: 0 })
  price: number;

  @Prop({ default: 'BDT' })
  currency: string;
}

export const EventSchema = SchemaFactory.createForClass(Event);

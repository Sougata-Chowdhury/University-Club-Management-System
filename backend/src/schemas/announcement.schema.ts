import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './user.schema';
import { Club } from './club.schema';

export type AnnouncementDocument = Announcement & Document;

@Schema({ timestamps: true })
export class Announcement {
  @Prop({ required: true, trim: true, maxlength: 500 })
  message: string;

  @Prop({ type: String, default: null })
  image: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Club', required: true })
  club: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  likes: number;

  @Prop([{ type: Types.ObjectId, ref: 'User' }])
  likedBy: Types.ObjectId[];

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const AnnouncementSchema = SchemaFactory.createForClass(Announcement);

// Add indexes for better query performance
AnnouncementSchema.index({ club: 1, createdAt: -1 });
AnnouncementSchema.index({ createdBy: 1, createdAt: -1 });
AnnouncementSchema.index({ isActive: 1, createdAt: -1 });

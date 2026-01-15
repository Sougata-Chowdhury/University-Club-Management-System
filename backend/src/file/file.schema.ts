import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class File extends Document {
  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  originalname: string;

  @Prop({ required: true })
  mimetype: string;

  @Prop({ required: true })
  size: number;

  @Prop({ required: true })
  path: string;

  @Prop({ required: true })
  uploadedBy: string; // User ID

  @Prop({ default: 'general' })
  category: string; // profile, club, event, announcement, general

  @Prop()
  relatedId?: string; // Club ID, Event ID, etc.

  @Prop({ default: 'active' })
  status: string; // active, deleted, archived

  @Prop()
  alt?: string; // Alt text for images

  @Prop()
  description?: string;

  @Prop({ default: false })
  isPublic: boolean;

  @Prop()
  tags?: string[];

  @Prop({ type: Object })
  metadata?: {
    width?: number;
    height?: number;
    duration?: number; // For videos
    thumbnailPath?: string;
  };
}

export const FileSchema = SchemaFactory.createForClass(File);

// Indexes for better performance
FileSchema.index({ uploadedBy: 1, category: 1 });
FileSchema.index({ relatedId: 1, category: 1 });
FileSchema.index({ createdAt: -1 });
FileSchema.index({ status: 1, isPublic: 1 });

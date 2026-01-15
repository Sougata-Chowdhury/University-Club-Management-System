import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ 
    required: true, 
    enum: ['club', 'event', 'payment', 'announcement', 'admin', 'system', 'reminder'],
    default: 'system'
  })
  type: string;

  @Prop({ 
    required: true, 
    enum: ['info', 'success', 'warning', 'error', 'urgent'],
    default: 'info'
  })
  priority: string;

  @Prop({ default: false })
  read: boolean;

  @Prop({ default: false })
  sent: boolean;

  @Prop()
  actionUrl?: string;

  @Prop()
  actionText?: string;

  @Prop({ type: Types.ObjectId })
  relatedId?: Types.ObjectId;

  @Prop()
  relatedType?: string; // 'club', 'event', 'payment', 'announcement'

  @Prop()
  scheduledFor?: Date;

  @Prop()
  sentAt?: Date;

  @Prop()
  readAt?: Date;

  @Prop({ 
    type: {
      email: { type: Boolean, default: false },
      push: { type: Boolean, default: false },
      inApp: { type: Boolean, default: true }
    },
    default: {
      email: false,
      push: false,
      inApp: true
    }
  })
  channels: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };

  @Prop({
    type: {
      emailTemplate: String,
      pushIcon: String,
      customData: Object
    }
  })
  metadata?: {
    emailTemplate?: string;
    pushIcon?: string;
    customData?: any;
  };

  @Prop({ default: Date.now, expires: '90d' }) // Auto-delete after 90 days
  expiresAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Add indexes for better performance
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ type: 1, priority: 1 });
NotificationSchema.index({ scheduledFor: 1, sent: 1 });

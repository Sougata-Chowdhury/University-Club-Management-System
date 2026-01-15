import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReportDocument = Report & Document;

export enum ReportType {
  EVENT = 'event',
  CLUB = 'club',
  ANNOUNCEMENT = 'announcement',
}

export enum ReportStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  ACTION_TAKEN = 'action_taken',
  DISMISSED = 'dismissed',
  RESOLVED = 'resolved',
}

export enum ReportCategory {
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  MISLEADING_INFO = 'misleading_info',
  VIOLATION_OF_RULES = 'violation_of_rules',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class Report {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reportedBy: Types.ObjectId;

  @Prop({ 
    type: String, 
    enum: Object.values(ReportType), 
    required: true 
  })
  type: ReportType;

  @Prop({ type: Types.ObjectId, required: true })
  targetId: Types.ObjectId; // ID of the reported item (event/club/announcement)

  @Prop({ 
    type: String, 
    enum: Object.values(ReportCategory), 
    required: true 
  })
  category: ReportCategory;

  @Prop({ required: true, maxlength: 1000 })
  description: string;

  @Prop({ maxlength: 2000 })
  additionalInfo?: string;

  @Prop([String])
  attachments?: string[]; // URLs of uploaded images

  @Prop({ 
    type: String, 
    enum: Object.values(ReportStatus), 
    default: ReportStatus.PENDING 
  })
  status: ReportStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy?: Types.ObjectId;

  @Prop()
  reviewedAt?: Date;

  @Prop({ maxlength: 1000 })
  adminNotes?: string;

  @Prop({ maxlength: 1000 })
  actionTaken?: string;

  @Prop({ default: 1 })
  priority: number; // 1-5, 5 being highest priority

  // To track if user has been notified
  @Prop({ default: false })
  userNotifiedOfSubmission: boolean;

  @Prop({ default: false })
  userNotifiedOfAction: boolean;

  // For analytics
  @Prop()
  resolvedAt?: Date;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const ReportSchema = SchemaFactory.createForClass(Report);

// Indexes for better performance
ReportSchema.index({ reportedBy: 1, targetId: 1, type: 1 }, { unique: true });
ReportSchema.index({ status: 1 });
ReportSchema.index({ type: 1 });
ReportSchema.index({ createdAt: -1 });
ReportSchema.index({ priority: -1 });

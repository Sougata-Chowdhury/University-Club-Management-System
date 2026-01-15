import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FeedbackDocument = Feedback & Document;

@Schema({ timestamps: true })
export class Feedback {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ 
    type: String, 
    enum: ['club', 'event', 'announcement', 'general', 'course', 'instructor', 'facility'], 
    required: true 
  })
  targetType: string;

  @Prop({ type: Types.ObjectId, required: false })
  targetId: Types.ObjectId; // Club ID, Event ID, etc.

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ required: true, maxlength: 2000 })
  comment: string;

  @Prop({ 
    type: String,
    enum: ['general', 'organization', 'communication', 'facilities', 'content', 'instructor', 'other'],
    default: 'general'
  })
  category: string;

  @Prop({ default: false })
  isAnonymous: boolean;

  @Prop({ default: false })
  isVerified: boolean; // Admin verified feedback

  @Prop([String]) // File attachments from FileModule
  attachments: string[];

  @Prop({ 
    type: String,
    enum: ['pending', 'approved', 'rejected', 'under_review'],
    default: 'pending'
  })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy: Types.ObjectId;

  @Prop()
  adminResponse: string;

  @Prop({ default: 0 })
  helpfulVotes: number;

  @Prop([{ type: Types.ObjectId, ref: 'User' }])
  votedUsers: Types.ObjectId[];

  @Prop({ type: Date })
  respondedAt: Date;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: Date })
  deletedAt: Date;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);

// Indexes for performance
FeedbackSchema.index({ targetType: 1, targetId: 1 });
FeedbackSchema.index({ userId: 1 });
FeedbackSchema.index({ rating: 1 });
FeedbackSchema.index({ createdAt: -1 });
FeedbackSchema.index({ status: 1 });
FeedbackSchema.index({ isDeleted: 1 });

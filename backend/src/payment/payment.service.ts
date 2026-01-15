import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment, PaymentDocument, PaymentStatus } from '../schemas/payment.schema';
import { Event, EventDocument } from '../schemas/event.schema';
import { Club, ClubDocument } from '../schemas/club.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { CreatePaymentDto, UpdatePaymentDto, ApprovePaymentDto } from '../dto/payment.dto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(Club.name) private clubModel: Model<ClubDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(forwardRef(() => NotificationService)) private notificationService: NotificationService,
  ) {}

  async createPayment(createPaymentDto: CreatePaymentDto, userId: string) {
    const { eventId, paymentMethod, transactionId, notes, proofOfPayment } = createPaymentDto;

    // Get event details
    const event = await this.eventModel.findById(eventId).populate('clubId');
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (!event.isPaid) {
      throw new BadRequestException('This is a free event');
    }

    // Check if user is already registered for the event
    const userObjectId = new Types.ObjectId(userId);
    const isAlreadyRegistered = event.attendees.some(attendee => 
      attendee.equals(userObjectId)
    );
    
    if (isAlreadyRegistered) {
      throw new BadRequestException('You are already registered for this event');
    }

    // Check if user already has a payment for this event
    const existingPayment = await this.paymentModel.findOne({
      userId: userObjectId,
      eventId: new Types.ObjectId(eventId)
    });

    if (existingPayment) {
      if (existingPayment.status === PaymentStatus.APPROVED) {
        throw new BadRequestException('You have already paid for this event');
      } else if (existingPayment.status === PaymentStatus.PENDING) {
        throw new BadRequestException('You already have a pending payment for this event');
      }
    }

    // Check if event is full
    if (event.maxAttendees > 0 && event.attendees.length >= event.maxAttendees) {
      throw new BadRequestException('Event is full');
    }

    // Create payment record
    const payment = new this.paymentModel({
      userId: userObjectId,
      eventId: new Types.ObjectId(eventId),
      clubId: event.clubId,
      amount: event.price,
      currency: event.currency,
      status: PaymentStatus.PENDING,
      paymentMethod,
      transactionId: transactionId || null,
      notes: notes || null,
      proofOfPayment: proofOfPayment || null,
    });

    const savedPayment = await payment.save();
    
    console.log('Payment created successfully:', {
      paymentId: savedPayment._id,
      userId: savedPayment.userId,
      eventId: savedPayment.eventId,
      clubId: savedPayment.clubId,
      status: savedPayment.status
    });
    
    return await this.paymentModel
      .findById(savedPayment._id)
      .populate('userId', 'firstName lastName email')
      .populate('eventId', 'name date location')
      .populate('clubId', 'name')
      .lean();
  }

  async getUserPayments(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const payments = await this.paymentModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('eventId', 'name date location isPaid price currency')
      .populate('clubId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await this.paymentModel.countDocuments({ userId: new Types.ObjectId(userId) });

    return {
      payments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async getClubPayments(clubId: string, userId: string, page: number = 1, limit: number = 10) {
    // Verify user is club creator or member
    const club = await this.clubModel.findById(clubId);
    if (!club) {
      throw new NotFoundException('Club not found');
    }

    const userObjectId = new Types.ObjectId(userId);
    const isCreator = club.createdBy.equals(userObjectId);
    const isMember = club.members.some(memberId => memberId.equals(userObjectId));

    console.log('Club payment permissions check:', {
      clubId,
      userId,
      clubName: club.name,
      isCreator,
      isMember,
      clubCreatedBy: club.createdBy,
      clubMembers: club.members
    });

    if (!isCreator && !isMember) {
      throw new ForbiddenException('Only club creators and members can view payments');
    }

    const skip = (page - 1) * limit;

    // Debug: Check all payments in the database
    const allPayments = await this.paymentModel.find({}).lean();
    console.log('All payments in database:', allPayments.map(p => ({
      id: p._id,
      clubId: p.clubId,
      userId: p.userId,
      eventId: p.eventId,
      status: p.status
    })));

    const clubPaymentQuery = { clubId: new Types.ObjectId(clubId) };
    console.log('Searching for payments with query:', clubPaymentQuery);

    // Try both ObjectId and string formats for clubId
    const rawPayments = await this.paymentModel
      .find({
        $or: [
          { clubId: new Types.ObjectId(clubId) },
          { clubId: clubId }
        ]
      })
      .populate('userId', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    console.log('Raw payments found:', rawPayments.length);

    // Manually populate event data to handle missing events
    const payments: any[] = [];
    for (const payment of rawPayments) {
      const eventData = await this.eventModel.findById(payment.eventId).lean();
      
      // Create payment object with event data or fallback
      const enrichedPayment = {
        ...payment,
        eventId: eventData ? {
          _id: eventData._id,
          name: eventData.name,
          date: eventData.date,
          location: eventData.location,
          isPaid: eventData.isPaid,
          price: eventData.price,
          currency: eventData.currency
        } : {
          _id: payment.eventId,
          name: 'Event Deleted',
          date: null,
          location: 'N/A',
          isPaid: true,
          price: payment.amount,
          currency: payment.currency
        }
      };
      
      payments.push(enrichedPayment);
      
      console.log(`Payment ${payment._id}: Event ${payment.eventId} ${eventData ? 'found' : 'missing'}`);
    }

    const total = await this.paymentModel.countDocuments({
      $or: [
        { clubId: new Types.ObjectId(clubId) },
        { clubId: clubId }
      ]
    });

    console.log('getClubPayments results:', {
      clubId,
      userId,
      paymentsFound: payments.length,
      total
    });

    return {
      payments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async getClubPaymentHistory(clubId: string, userId: string, page: number = 1, limit: number = 10) {
    // Verify user is club creator or member
    const club = await this.clubModel.findById(clubId);
    if (!club) {
      throw new NotFoundException('Club not found');
    }

    const userObjectId = new Types.ObjectId(userId);
    const isCreator = club.createdBy.equals(userObjectId);
    const isMember = club.members.some(memberId => memberId.equals(userObjectId));

    if (!isCreator && !isMember) {
      throw new ForbiddenException('Only club creators and members can view payment history');
    }

    const skip = (page - 1) * limit;

    // Get only approved payments for payment history
    const rawPayments = await this.paymentModel
      .find({
        $and: [
          {
            $or: [
              { clubId: new Types.ObjectId(clubId) },
              { clubId: clubId }
            ]
          },
          { status: PaymentStatus.APPROVED }
        ]
      })
      .populate('userId', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName')
      .sort({ approvedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Manually populate event data to handle missing events
    const payments: any[] = [];
    for (const payment of rawPayments) {
      const eventData = await this.eventModel.findById(payment.eventId).lean();
      
      // Create payment object with event data or fallback
      const enrichedPayment = {
        ...payment,
        eventId: eventData ? {
          _id: eventData._id,
          name: eventData.name,
          date: eventData.date,
          location: eventData.location,
          isPaid: eventData.isPaid,
          price: eventData.price,
          currency: eventData.currency
        } : {
          _id: payment.eventId,
          name: 'Event Deleted',
          date: null,
          location: 'N/A',
          isPaid: true,
          price: payment.amount,
          currency: payment.currency
        }
      };
      
      payments.push(enrichedPayment);
    }

    const total = await this.paymentModel.countDocuments({
      $and: [
        {
          $or: [
            { clubId: new Types.ObjectId(clubId) },
            { clubId: clubId }
          ]
        },
        { status: PaymentStatus.APPROVED }
      ]
    });

    return {
      payments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async getEventPayments(eventId: string, userId: string) {
    // Get event and verify user permissions
    const event = await this.eventModel.findById(eventId).populate('clubId');
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const club = await this.clubModel.findById(event.clubId);
    if (!club) {
      throw new NotFoundException('Club not found');
    }
    
    const userObjectId = new Types.ObjectId(userId);
    const isCreator = club.createdBy.equals(userObjectId);
    const isMember = club.members.some(memberId => memberId.equals(userObjectId));

    if (!isCreator && !isMember) {
      throw new ForbiddenException('Only club creators and members can view event payments');
    }

    const payments = await this.paymentModel
      .find({
        $or: [
          { eventId: new Types.ObjectId(eventId) },
          { eventId: eventId }
        ]
      })
      .populate('userId', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();

    return payments;
  }

  async approvePayment(paymentId: string, approvePaymentDto: ApprovePaymentDto, userId: string) {
    const payment = await this.paymentModel.findById(paymentId).populate('eventId clubId');
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Verify user can approve this payment (club creator or member)
    const club = await this.clubModel.findById(payment.clubId);
    if (!club) {
      throw new NotFoundException('Club not found');
    }

    const userObjectId = new Types.ObjectId(userId);
    const isCreator = club.createdBy.equals(userObjectId);
    const isMember = club.members.some(memberId => memberId.equals(userObjectId));

    if (!isCreator && !isMember) {
      throw new ForbiddenException('Only club creators and members can approve payments');
    }

    const { status, rejectionReason, notes } = approvePaymentDto;

    // Update payment
    payment.status = status;
    payment.approvedBy = new Types.ObjectId(userId);
    payment.approvedAt = new Date();
    
    if (rejectionReason) {
      payment.rejectionReason = rejectionReason;
    }
    
    if (notes) {
      payment.notes = notes;
    }

    await payment.save();

    // If approved, add user to event attendees and create notification
    if (status === PaymentStatus.APPROVED) {
      const event = await this.eventModel.findById(payment.eventId);
      if (event) {
        // Proper ObjectId comparison to check if user is already registered
        const userObjectId = payment.userId instanceof Types.ObjectId 
          ? payment.userId 
          : new Types.ObjectId(payment.userId);
        
        const isAlreadyRegistered = event.attendees.some(attendee => 
          attendee.equals(userObjectId)
        );
        
        if (!isAlreadyRegistered) {
          event.attendees.push(userObjectId);
          await event.save();
          console.log(`User ${userObjectId} added to event ${event._id} attendees after payment approval`);
        } else {
          console.log(`User ${userObjectId} already registered for event ${event._id}`);
        }
      }

      // Create notification for payment approval
      await this.notificationService.createNotification(payment.userId.toString(), {
        type: 'payment',
        title: 'Payment Approved',
        message: `Your payment for event "${event?.name}" has been approved!`,
        relatedId: paymentId,
        relatedType: 'Payment',
      });
    } else if (status === PaymentStatus.REJECTED) {
      // Create notification for payment rejection
      const event = await this.eventModel.findById(payment.eventId);
      await this.notificationService.createNotification(payment.userId.toString(), {
        type: 'payment',
        title: 'Payment Rejected',
        message: `Your payment for event "${event?.name}" has been rejected. ${rejectionReason ? `Reason: ${rejectionReason}` : ''}`,
        relatedId: paymentId,
        relatedType: 'Payment',
      });
    }

    return await this.paymentModel
      .findById(paymentId)
      .populate('userId', 'firstName lastName email')
      .populate('eventId', 'name date location')
      .populate('clubId', 'name')
      .populate('approvedBy', 'firstName lastName')
      .lean();
  }

  async getPaymentById(paymentId: string, userId: string) {
    const payment = await this.paymentModel
      .findById(paymentId)
      .populate('userId', 'firstName lastName email')
      .populate('eventId', 'name date location isPaid price currency')
      .populate('clubId', 'name')
      .populate('approvedBy', 'firstName lastName')
      .lean();

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Check if user can view this payment
    const userObjectId = new Types.ObjectId(userId);
    const isOwner = payment.userId._id.equals(userObjectId);
    
    if (!isOwner) {
      // Check if user is club creator or member
      const club = await this.clubModel.findById(payment.clubId);
      if (!club) {
        throw new NotFoundException('Club not found');
      }

      const isCreator = club.createdBy.equals(userObjectId);
      const isMember = club.members.some(memberId => memberId.equals(userObjectId));
      
      if (!isCreator && !isMember) {
        throw new ForbiddenException('You do not have permission to view this payment');
      }
    }

    return payment;
  }

  async updatePayment(paymentId: string, updatePaymentDto: UpdatePaymentDto, userId: string) {
    const payment = await this.paymentModel.findById(paymentId);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Only payment owner can update (before approval)
    if (!payment.userId.equals(new Types.ObjectId(userId))) {
      throw new ForbiddenException('Only payment owner can update payment details');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Can only update pending payments');
    }

    const updatedPayment = await this.paymentModel
      .findByIdAndUpdate(paymentId, updatePaymentDto, { new: true })
      .populate('userId', 'firstName lastName email')
      .populate('eventId', 'name date location')
      .populate('clubId', 'name')
      .lean();

    return updatedPayment;
  }

  async getPaymentStats(userId: string) {
    const userObjectId = new Types.ObjectId(userId);

    // User's payment stats
    const totalPayments = await this.paymentModel.countDocuments({ userId: userObjectId });
    const approvedPayments = await this.paymentModel.countDocuments({ 
      userId: userObjectId, 
      status: PaymentStatus.APPROVED 
    });
    const pendingPayments = await this.paymentModel.countDocuments({ 
      userId: userObjectId, 
      status: PaymentStatus.PENDING 
    });

    const totalSpent = await this.paymentModel.aggregate([
      { $match: { userId: userObjectId, status: PaymentStatus.APPROVED } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    return {
      totalPayments,
      approvedPayments,
      pendingPayments,
      totalSpent: totalSpent.length > 0 ? totalSpent[0].total : 0,
    };
  }
}

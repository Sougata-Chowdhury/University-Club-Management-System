import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event, EventDocument } from '../schemas/event.schema';
import { Club, ClubDocument } from '../schemas/club.schema';
import { CreateEventDto, UpdateEventDto } from '../dto/event.dto';
import { NotificationService } from '../notification/notification.service';
import { UserService } from '../user/user.service';

@Injectable()
export class EventService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(Club.name) private clubModel: Model<ClubDocument>,
    @Inject(forwardRef(() => NotificationService)) private notificationService: NotificationService,
    @Inject(forwardRef(() => UserService)) private userService: UserService,
  ) {}

  async createEvent(createEventDto: CreateEventDto, userId: string) {
    // Validate that the event date is in the future
    const eventDate = new Date(createEventDto.date);
    const now = new Date();
    if (eventDate <= now) {
      throw new ForbiddenException('Event date must be in the future. Past events cannot be created.');
    }

    // Verify that the user owns the club
    const club = await this.clubModel.findById(createEventDto.clubId);
    if (!club) {
      throw new NotFoundException('Club not found');
    }

    // Use proper ObjectId comparison
    if (!club.createdBy.equals(new Types.ObjectId(userId))) {
      throw new ForbiddenException('You can only create events for clubs you own');
    }

    const event = new this.eventModel({
      ...createEventDto,
      createdBy: userId,
      attendees: [],
    });

    const savedEvent = await event.save();

    // Log activity
    try {
      await this.userService.logUserActivity(userId, {
        activityType: 'event_created',
        description: `Created event "${createEventDto.name}"`,
        relatedId: savedEvent._id as string,
        metadata: { eventName: createEventDto.name, action: 'create' }
      });
    } catch (error) {
      console.error('Error logging event creation activity:', error);
    }

    return savedEvent.populate([
      { path: 'clubId', select: 'name' },
      { path: 'createdBy', select: 'firstName lastName email' }
    ]);
  }

  async getAllEvents() {
    return this.eventModel
      .find({ isActive: true })
      .populate('clubId', 'name description')
      .populate('createdBy', 'firstName lastName email')
      .populate('attendees', '_id firstName lastName email')
      .sort({ date: 1 });
  }

  async getAllEventsWithStatus() {
    const events = await this.eventModel
      .find({ isActive: true })
      .populate('clubId', 'name description logoUrl')
      .populate('createdBy', 'firstName lastName email')
      .populate('attendees', '_id firstName lastName email')
      .sort({ date: 1 });

    const now = new Date();
    
    return events.map(event => {
      const eventDate = new Date(event.date);
      const status = eventDate < now ? 'completed' : 'upcoming';
      
      return {
        ...event.toObject(),
        status,
        timeUntil: this.getTimeUntilEvent(eventDate, now)
      };
    });
  }

  private getTimeUntilEvent(eventDate: Date, now: Date): string {
    const diffMs = eventDate.getTime() - now.getTime();
    
    if (diffMs < 0) {
      // Event has passed
      const daysPassed = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
      if (daysPassed === 0) return 'Today (Completed)';
      if (daysPassed === 1) return '1 day ago';
      return `${daysPassed} days ago`;
    }
    
    // Event is upcoming
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days === 0) {
      if (hours === 0) return 'Starting soon';
      if (hours === 1) return 'In 1 hour';
      return `In ${hours} hours`;
    }
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  }

  async getEventsByClub(clubId: string) {
    return this.eventModel
      .find({ clubId, isActive: true })
      .populate('clubId', 'name description')
      .populate('createdBy', 'firstName lastName email')
      .populate('attendees', '_id firstName lastName email')
      .sort({ date: 1 });
  }

  async getRegisteredEvents(userId: string) {
    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    
    return this.eventModel
      .find({ 
        attendees: userObjectId,
        isActive: true 
      })
      .populate('clubId', 'name description logoUrl')
      .populate('createdBy', 'firstName lastName email')
      .populate('attendees', '_id firstName lastName email')
      .sort({ date: 1 });
  }

  async getUserEvents(userId: string) {
    // Get clubs owned by the user - handle both string and ObjectId
    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const ownedClubs = await this.clubModel.find({ createdBy: userObjectId }).select('_id');
    const clubIds = ownedClubs.map(club => club._id);

    console.log('getUserEvents - userId:', userId);
    console.log('getUserEvents - userObjectId:', userObjectId);
    console.log('getUserEvents - ownedClubs:', ownedClubs.length);
    console.log('getUserEvents - clubIds:', clubIds);

    // Let's check what events exist in the database
    const allEvents = await this.eventModel.find({ isActive: true });
    console.log('getUserEvents - all active events:', allEvents.length);
    if (allEvents.length > 0) {
      console.log('getUserEvents - first event clubId:', allEvents[0].clubId);
      console.log('getUserEvents - first event clubId type:', typeof allEvents[0].clubId);
    }

    // Convert ObjectIds to strings for comparison since clubId in events might be stored as string
    const clubIdStrings = clubIds.map((id: any) => id.toString());
    
    console.log('getUserEvents - clubIdStrings:', clubIdStrings);

    const events = await this.eventModel
      .find({ 
        $and: [
          { $or: [
            { clubId: { $in: clubIds } },           // Match ObjectIds
            { clubId: { $in: clubIdStrings } }      // Match strings
          ]},
          { isActive: true }
        ]
      })
      .populate('clubId', 'name description')
      .populate('createdBy', 'firstName lastName email')
      .populate('attendees', '_id firstName lastName email')
      .sort({ date: 1 });

    console.log('getUserEvents - events found:', events.length);
    return events;
  }

  async getEventById(eventId: string) {
    const event = await this.eventModel
      .findById(eventId)
      .populate('clubId', 'name description createdBy')
      .populate('createdBy', 'firstName lastName email')
      .populate('attendees', '_id firstName lastName email');

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async updateEvent(eventId: string, updateEventDto: UpdateEventDto, userId: string) {
    const event = await this.eventModel.findById(eventId).populate('clubId');
    
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if user owns the club that owns this event
    const club = await this.clubModel.findById(event.clubId);
    if (!club) {
      throw new NotFoundException('Club not found');
    }

    // Handle both string and ObjectId userId types
    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    if (!club.createdBy.equals(userObjectId)) {
      throw new ForbiddenException('You can only update events for clubs you own');
    }

    // If updating the date, validate it's in the future
    if (updateEventDto.date) {
      const newEventDate = new Date(updateEventDto.date);
      const now = new Date();
      if (newEventDate <= now) {
        throw new ForbiddenException('Event date must be in the future. Cannot update to a past date.');
      }
    }

    Object.assign(event, updateEventDto);
    return await event.save().then(event => 
      event.populate([
        { path: 'clubId', select: 'name' },
        { path: 'createdBy', select: 'firstName lastName email' }
      ])
    );
  }

  async deleteEvent(eventId: string, userId: string) {
    const event = await this.eventModel.findById(eventId);
    
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if user owns the club that owns this event
    const club = await this.clubModel.findById(event.clubId);
    if (!club) {
      throw new NotFoundException('Club not found');
    }

    // Handle both string and ObjectId userId types
    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    if (!club.createdBy.equals(userObjectId)) {
      throw new ForbiddenException('You can only delete events for clubs you own');
    }

    await this.eventModel.findByIdAndDelete(eventId);
    return { message: 'Event deleted successfully' };
  }

  async joinEvent(eventId: string, userId: string) {
    const event = await this.eventModel.findById(eventId);
    
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if event date has passed
    const eventDate = new Date(event.date);
    const now = new Date();
    if (eventDate < now) {
      throw new ForbiddenException('Cannot register for past events. This event has already occurred.');
    }

    // Proper ObjectId comparison to check if user is already registered
    const userObjectId = new Types.ObjectId(userId);
    const isAlreadyRegistered = event.attendees.some(attendee => 
      attendee.equals(userObjectId)
    );
    
    if (isAlreadyRegistered) {
      throw new ForbiddenException('You are already registered for this event');
    }

    if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
      throw new ForbiddenException('Event is full');
    }

    event.attendees.push(userObjectId);
    await event.save();

    // Log activity
    try {
      await this.userService.logUserActivity(userId, {
        activityType: 'event_joined',
        description: `Registered for event "${event.name}"`,
        relatedId: eventId,
        metadata: { eventName: event.name, action: 'register' }
      });
    } catch (error) {
      console.error('Error logging event join activity:', error);
    }

    // Send event registration notification
    try {
      await this.notificationService.createEventRegistrationNotification(
        userId,
        event.name,
        eventId
      );
    } catch (notificationError) {
      console.error('Failed to send event registration notification:', notificationError);
      // Don't fail the registration if notification fails
    }
    
    return { message: 'Successfully registered for event' };
  }

  async leaveEvent(eventId: string, userId: string) {
    const event = await this.eventModel.findById(eventId);
    
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Proper ObjectId comparison to find the attendee
    const userObjectId = new Types.ObjectId(userId);
    const attendeeIndex = event.attendees.findIndex(attendee => 
      attendee.equals(userObjectId)
    );
    
    if (attendeeIndex === -1) {
      throw new ForbiddenException('You are not registered for this event');
    }

    event.attendees.splice(attendeeIndex, 1);
    await event.save();
    
    return { message: 'Successfully unregistered from event' };
  }
}

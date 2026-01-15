import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto, UpdateEventDto } from '../dto/event.dto';
import { AuthGuard } from '../guards/auth.guard';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  @UseGuards(AuthGuard)
  async createEvent(@Body() createEventDto: CreateEventDto, @Request() req) {
    return this.eventService.createEvent(createEventDto, req.user.userId);
  }

  @Get()
  async getAllEvents() {
    return this.eventService.getAllEvents();
  }

  @Get('browse')
  async browseEventsWithStatus() {
    return this.eventService.getAllEventsWithStatus();
  }

  @Get('registered')
  @UseGuards(AuthGuard)
  async getRegisteredEvents(@Request() req) {
    return this.eventService.getRegisteredEvents(req.user.userId);
  }

  @Get('my-events')
  @UseGuards(AuthGuard)
  async getUserEvents(@Request() req) {
    return this.eventService.getUserEvents(req.user.userId);
  }

  @Get('club/:clubId')
  async getEventsByClub(@Param('clubId') clubId: string) {
    return this.eventService.getEventsByClub(clubId);
  }

  @Get(':id')
  async getEventById(@Param('id') id: string) {
    return this.eventService.getEventById(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async updateEvent(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Request() req
  ) {
    return this.eventService.updateEvent(id, updateEventDto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteEvent(@Param('id') id: string, @Request() req) {
    return this.eventService.deleteEvent(id, req.user.userId);
  }

  @Post(':id/join')
  @UseGuards(AuthGuard)
  async joinEvent(@Param('id') id: string, @Request() req) {
    return this.eventService.joinEvent(id, req.user.userId);
  }

  @Delete(':id/leave')
  @UseGuards(AuthGuard)
  async leaveEvent(@Param('id') id: string, @Request() req) {
    return this.eventService.leaveEvent(id, req.user.userId);
  }
}

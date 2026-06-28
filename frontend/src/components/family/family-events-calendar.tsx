"use client";

import { useState } from "react";

import { type CalendarEvent, EventCalendar } from "@/components/event-calendar";

export function FamilyEventsCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const handleEventAdd = (event: CalendarEvent) => {
    setEvents((currentEvents) => [...currentEvents, event]);
  };

  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    setEvents((currentEvents) =>
      currentEvents.map((event) =>
        event.id === updatedEvent.id ? updatedEvent : event,
      ),
    );
  };

  const handleEventDelete = (eventId: string) => {
    setEvents((currentEvents) =>
      currentEvents.filter((event) => event.id !== eventId),
    );
  };

  return (
    <div className="flex min-h-[680px] flex-1 flex-col">
      <EventCalendar
        events={events}
        initialView="month"
        onEventAdd={handleEventAdd}
        onEventDelete={handleEventDelete}
        onEventUpdate={handleEventUpdate}
      />
    </div>
  );
}

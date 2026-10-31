"use client";

import { addDays, format, isToday } from "date-fns";
import { CalendarXIcon } from "lucide-react";
import { useMemo } from "react";

import {
  AgendaDaysToShow,
  type CalendarEvent,
  EventItem,
  getAgendaEventsForDay,
} from "@/components/event-calendar";
import { createTranslator } from "@/i18n/translate";

interface AgendaViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventSelect: (event: CalendarEvent) => void;
}

export function AgendaView({
  currentDate,
  events,
  onEventSelect,
}: AgendaViewProps) {
  const t = createTranslator("EventCalendar");
  const days = useMemo(() => {
    return Array.from({ length: AgendaDaysToShow }, (_, i) =>
      addDays(new Date(currentDate), i),
    );
  }, [currentDate]);

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventSelect(event);
  };

  // Check if there are any days with events
  const hasEvents = days.some(
    (day) => getAgendaEventsForDay(events, day).length > 0,
  );

  return (
    <div className="border-border/70 border-t px-4">
      {!hasEvents ? (
        <div className="flex min-h-[70svh] flex-col items-center justify-center py-16 text-center">
          <CalendarXIcon className="mb-2 text-muted-foreground/50" size={32} />
          <h3 className="font-medium text-lg">{t("noEventsFound")}</h3>
          <p className="text-muted-foreground">{t("noEventsPeriod")}</p>
        </div>
      ) : (
        days.map((day) => {
          const dayEvents = getAgendaEventsForDay(events, day);

          if (dayEvents.length === 0) return null;

          return (
            <div
              className="relative my-12 border-border/70 border-t"
              key={day.toString()}
            >
              <span
                className="-top-3 absolute left-0 flex h-6 items-center bg-background pe-4 text-[10px] uppercase data-today:font-medium sm:pe-4 sm:text-xs"
                data-today={isToday(day) || undefined}
              >
                {format(day, "d MMM, EEEE")}
              </span>
              <div className="mt-6 flex flex-col gap-2">
                {dayEvents.map((event) => (
                  <EventItem
                    event={event}
                    key={event.id}
                    onClick={(e) => handleEventClick(event, e)}
                    view="agenda"
                  />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

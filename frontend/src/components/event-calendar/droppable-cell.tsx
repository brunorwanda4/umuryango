"use client";

import { useDroppable } from "@dnd-kit/core";

import { useCalendarDnd } from "@/components/event-calendar";
import { cn } from "@/lib/utils";

interface DroppableCellProps {
  id: string;
  date: Date;
  time?: number; // For week/day views, represents hours (e.g., 9.25 for 9:15)
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function DroppableCell({
  id,
  date,
  time,
  children,
  className,
  onClick,
}: DroppableCellProps) {
  const { activeEvent } = useCalendarDnd();

  const { setNodeRef, isOver } = useDroppable({
    data: {
      date,
      time,
    },
    id,
  });

  const formattedTime =
    time !== undefined
      ? `${Math.floor(time)}:${Math.round((time - Math.floor(time)) * 60)
          .toString()
          .padStart(2, "0")}`
      : null;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onClick || (event.key !== "Enter" && event.key !== " ")) {
      return;
    }

    event.preventDefault();
    onClick();
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: CSS grid calendar cells cannot be rendered as table cells here.
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden px-0.5 py-1 data-dragging:bg-accent sm:px-1",
        className,
      )}
      data-dragging={isOver && activeEvent ? true : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      ref={setNodeRef}
      role="gridcell"
      tabIndex={0}
      title={formattedTime ? `${formattedTime}` : undefined}
    >
      {children}
    </div>
  );
}

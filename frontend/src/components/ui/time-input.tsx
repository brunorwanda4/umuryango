"use client";

import { format, isValid, parseISO } from "date-fns";
import { ChevronDown, ChevronUp, ClockIcon } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface TimeInputProps {
  id?: string;
  name?: string;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  "aria-invalid"?: boolean;
  className?: string;
  onChange?: (value: string) => void;
  onValueChange?: (value: string) => void;
  onBlur?: () => void;
}

const TimeInput = React.forwardRef<HTMLButtonElement, TimeInputProps>(
  function TimeInput(
    {
      id,
      name,
      value,
      placeholder = "Pick date & time",
      disabled,
      required,
      "aria-invalid": invalid,
      className,
      onChange,
      onValueChange,
      onBlur,
    },
    ref,
  ) {
    const [open, setOpen] = React.useState(false);

    // Detect format of initial/incoming value
    const formatType = React.useMemo(() => {
      if (!value) return "datetime";
      if (/^\d{2}:\d{2}$/.test(value)) return "time";
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return "date";
      return "datetime";
    }, [value]);

    // Parse the current value
    const parsedDate = React.useMemo(() => {
      if (!value) return new Date();

      try {
        const date = parseISO(value);
        if (isValid(date)) return date;
      } catch {}

      if (/^\d{2}:\d{2}$/.test(value)) {
        const [h, m] = value.split(":").map(Number);
        const date = new Date();
        date.setHours(h, m, 0, 0);
        return date;
      }

      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const date = new Date(value);
        if (isValid(date)) return date;
      }

      const date = new Date(value);
      if (isValid(date)) return date;

      return new Date();
    }, [value]);

    // Local temporary state when popover is open
    const [tempDate, setTempDate] = React.useState<Date>(parsedDate);
    const [currentYear, setCurrentYear] = React.useState<number>(
      parsedDate.getFullYear(),
    );
    const [currentMonth, setCurrentMonth] = React.useState<number>(
      parsedDate.getMonth(),
    ); // 0-11

    const [hourStr, setHourStr] = React.useState(format(parsedDate, "HH"));
    const [minuteStr, setMinuteStr] = React.useState(format(parsedDate, "mm"));

    // Sync state when open changes or value changes
    React.useEffect(() => {
      if (open) {
        setTempDate(parsedDate);
        setCurrentYear(parsedDate.getFullYear());
        setCurrentMonth(parsedDate.getMonth());
        setHourStr(format(parsedDate, "HH"));
        setMinuteStr(format(parsedDate, "mm"));
      }
    }, [open, parsedDate]);

    // Calendar grid calculation starting on Monday
    const gridDays = React.useMemo(() => {
      const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
      const dayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)

      // Calculate offset for Monday-start calendar
      const prevMonthDaysCount = (dayOfWeek - 1 + 7) % 7;
      const gridStart = new Date(firstDayOfMonth);
      gridStart.setDate(gridStart.getDate() - prevMonthDaysCount);

      const days: Date[] = [];
      for (let i = 0; i < 42; i++) {
        const d = new Date(gridStart);
        d.setDate(d.getDate() + i);
        days.push(d);
      }
      return days;
    }, [currentYear, currentMonth]);

    const handlePrevMonth = () => {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear((prev) => prev - 1);
      } else {
        setCurrentMonth((prev) => prev - 1);
      }
    };

    const handleNextMonth = () => {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear((prev) => prev + 1);
      } else {
        setCurrentMonth((prev) => prev + 1);
      }
    };

    const handleDayClick = (day: Date) => {
      const newDate = new Date(tempDate);
      newDate.setFullYear(day.getFullYear());
      newDate.setMonth(day.getMonth());
      newDate.setDate(day.getDate());
      setTempDate(newDate);

      // Keep view in sync if clicked trailing/leading day
      if (day.getMonth() !== currentMonth) {
        setCurrentMonth(day.getMonth());
        setCurrentYear(day.getFullYear());
      }
    };

    // Hour handlers
    const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/\D/g, "");
      if (val.length <= 2) {
        setHourStr(val);
        const numeric = parseInt(val, 10);
        if (!Number.isNaN(numeric) && numeric >= 0 && numeric <= 23) {
          const newDate = new Date(tempDate);
          newDate.setHours(numeric);
          setTempDate(newDate);
        }
      }
    };

    const handleHourBlur = () => {
      let numeric = parseInt(hourStr, 10);
      if (Number.isNaN(numeric) || numeric < 0 || numeric > 23) {
        numeric = 0;
      }
      const formatted = String(numeric).padStart(2, "0");
      setHourStr(formatted);
      const newDate = new Date(tempDate);
      newDate.setHours(numeric);
      setTempDate(newDate);
    };

    const handleHourKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        let val = parseInt(hourStr, 10);
        val = Number.isNaN(val) ? 0 : (val + 1) % 24;
        const formatted = String(val).padStart(2, "0");
        setHourStr(formatted);
        const newDate = new Date(tempDate);
        newDate.setHours(val);
        setTempDate(newDate);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        let val = parseInt(hourStr, 10);
        val = Number.isNaN(val) ? 0 : (val - 1 + 24) % 24;
        const formatted = String(val).padStart(2, "0");
        setHourStr(formatted);
        const newDate = new Date(tempDate);
        newDate.setHours(val);
        setTempDate(newDate);
      }
    };

    // Minute handlers
    const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/\D/g, "");
      if (val.length <= 2) {
        setMinuteStr(val);
        const numeric = parseInt(val, 10);
        if (!Number.isNaN(numeric) && numeric >= 0 && numeric <= 59) {
          const newDate = new Date(tempDate);
          newDate.setMinutes(numeric);
          setTempDate(newDate);
        }
      }
    };

    const handleMinuteBlur = () => {
      let numeric = parseInt(minuteStr, 10);
      if (Number.isNaN(numeric) || numeric < 0 || numeric > 59) {
        numeric = 0;
      }
      const formatted = String(numeric).padStart(2, "0");
      setMinuteStr(formatted);
      const newDate = new Date(tempDate);
      newDate.setMinutes(numeric);
      setTempDate(newDate);
    };

    const handleMinuteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        let val = parseInt(minuteStr, 10);
        val = Number.isNaN(val) ? 0 : (val + 1) % 60;
        const formatted = String(val).padStart(2, "0");
        setMinuteStr(formatted);
        const newDate = new Date(tempDate);
        newDate.setMinutes(val);
        setTempDate(newDate);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        let val = parseInt(minuteStr, 10);
        val = Number.isNaN(val) ? 0 : (val - 1 + 60) % 60;
        const formatted = String(val).padStart(2, "0");
        setMinuteStr(formatted);
        const newDate = new Date(tempDate);
        newDate.setMinutes(val);
        setTempDate(newDate);
      }
    };

    const handleSave = () => {
      // Ensure hour and minute inputs are fully resolved and blurred
      let finalHours = parseInt(hourStr, 10);
      if (Number.isNaN(finalHours) || finalHours < 0 || finalHours > 23)
        finalHours = 0;

      let finalMinutes = parseInt(minuteStr, 10);
      if (Number.isNaN(finalMinutes) || finalMinutes < 0 || finalMinutes > 59)
        finalMinutes = 0;

      const finalDate = new Date(tempDate);
      finalDate.setHours(finalHours, finalMinutes, 0, 0);

      let formatted = "";
      if (formatType === "time") {
        formatted = format(finalDate, "HH:mm");
      } else if (formatType === "date") {
        formatted = format(finalDate, "yyyy-MM-dd");
      } else {
        formatted = finalDate.toISOString();
      }

      onChange?.(formatted);
      onValueChange?.(formatted);
      setOpen(false);
      onBlur?.();
    };

    const handleCancel = () => {
      setOpen(false);
      onBlur?.();
    };

    // Format display string for Trigger
    const displayLabel = React.useMemo(() => {
      if (!value) return placeholder;
      if (formatType === "time") {
        return format(parsedDate, "HH:mm");
      }
      if (formatType === "date") {
        return format(parsedDate, "PPP");
      }
      return format(parsedDate, "MMM d, yyyy, HH:mm");
    }, [value, parsedDate, formatType, placeholder]);

    return (
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (!next) {
            onBlur?.();
          }
          setOpen(next);
        }}
      >
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            id={id}
            name={name}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-invalid={invalid}
            aria-required={required}
            className={cn(
              "h-8 w-full min-w-0 rounded-2xl border border-transparent bg-input/50 px-2.5 py-1 text-base text-left justify-start font-normal transition-[color,box-shadow] duration-200 outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm gap-2",
              !value && "text-muted-foreground",
              className,
            )}
          >
            <ClockIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{displayLabel}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[300px] rounded-2xl p-4 bg-popover border border-border shadow-lg"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-1 py-1 mb-2 select-none">
            <span className="text-base font-medium text-foreground">
              {format(new Date(currentYear, currentMonth, 1), "MMMM yyyy")}
            </span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 p-0 rounded-md hover:bg-muted"
                onClick={handlePrevMonth}
              >
                <ChevronUp className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 p-0 rounded-md hover:bg-muted"
                onClick={handleNextMonth}
              >
                <ChevronDown className="size-4" />
              </Button>
            </div>
          </div>

          {/* Weekdays Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
              <div
                key={day}
                className="text-xs font-semibold text-muted-foreground py-1 select-none"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {gridDays.map((day) => {
              const isCurrentMonth = day.getMonth() === currentMonth;
              const isSelected =
                tempDate.getDate() === day.getDate() &&
                tempDate.getMonth() === day.getMonth() &&
                tempDate.getFullYear() === day.getFullYear();

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "h-9 w-full flex items-center justify-center rounded-lg text-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    isCurrentMonth
                      ? "text-foreground"
                      : "text-muted-foreground/30",
                    isSelected
                      ? "bg-sky-500/20 border-2 border-sky-400 text-sky-600 dark:text-sky-300 font-semibold"
                      : "hover:bg-muted",
                  )}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          {/* Time Picker Inputs */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="flex flex-col gap-1">
              <input
                type="text"
                value={hourStr}
                onChange={handleHourChange}
                onBlur={handleHourBlur}
                onKeyDown={handleHourKeyDown}
                className="h-9 w-full rounded-lg border border-border bg-input/55 text-center font-medium text-foreground outline-none transition-[color,box-shadow] duration-200 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-1">
              <input
                type="text"
                value={minuteStr}
                onChange={handleMinuteChange}
                onBlur={handleMinuteBlur}
                onKeyDown={handleMinuteKeyDown}
                className="h-9 w-full rounded-lg border border-border bg-input/55 text-center font-medium text-foreground outline-none transition-[color,box-shadow] duration-200 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              className="rounded-xl w-full text-foreground/80 hover:text-foreground hover:bg-muted h-9 text-sm"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="rounded-xl w-full bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-sm font-medium"
            >
              Save
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  },
);

export { TimeInput };

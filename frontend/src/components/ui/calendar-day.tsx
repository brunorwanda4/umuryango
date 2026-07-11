"use client";

import { format, isAfter, isBefore, isValid, parse, subDays } from "date-fns";
import { CalendarIcon, CheckIcon, ClockIcon } from "lucide-react";
import { forwardRef, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const DATE_VALUE_FORMAT = "yyyy-MM-dd";
const TIME_VALUE_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

type PickerProps = {
  id?: string;
  name?: string;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  "aria-invalid"?: boolean;
  className?: string;
  onBlur?: () => void;
  onValueChange: (value: string) => void;
};

type DatePickerInputProps = PickerProps & {
  min?: string | number;
  max?: string | number;
};

type TimePickerInputProps = PickerProps & {
  min?: string | number;
  max?: string | number;
  step?: string | number;
};

function parseDateValue(value?: string | number) {
  if (typeof value !== "string" || !value) return undefined;

  const parsedDate = parse(value, DATE_VALUE_FORMAT, new Date());
  return isValid(parsedDate) ? parsedDate : undefined;
}

function isDateWithinLimits(date: Date, minDate?: Date, maxDate?: Date) {
  return !(
    (minDate && isBefore(date, minDate)) ||
    (maxDate && isAfter(date, maxDate))
  );
}

const DatePickerInput = forwardRef<HTMLButtonElement, DatePickerInputProps>(
  function DatePickerInput(
    {
      id,
      name,
      value,
      placeholder = "Pick a date",
      disabled,
      required,
      "aria-invalid": invalid,
      className,
      min,
      max,
      onBlur,
      onValueChange,
    },
    ref,
  ) {
    const [open, setOpen] = useState(false);
    const selectedDate = parseDateValue(value);
    const minDate = parseDateValue(min);
    const maxDate = parseDateValue(max);
    const today = new Date();
    const yesterday = subDays(today, 1);
    const disabledDates = [
      ...(minDate ? [{ before: minDate }] : []),
      ...(maxDate ? [{ after: maxDate }] : []),
    ];

    const selectDate = (date: Date) => {
      if (!isDateWithinLimits(date, minDate, maxDate)) return;
      onValueChange(format(date, DATE_VALUE_FORMAT));
      setOpen(false);
    };

    return (
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) onBlur?.();
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
            aria-label={selectedDate ? undefined : placeholder}
            onBlur={onBlur}
            className={cn(
              "w-full justify-start font-normal",
              !selectedDate && "text-muted-foreground",
              className,
            )}
          >
            <CalendarIcon data-icon="inline-start" />
            {selectedDate ? format(selectedDate, "PPP") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <div className="flex max-sm:flex-col">
            <div className="flex gap-1 border-b p-2 sm:w-28 sm:flex-col sm:border-r sm:border-b-0">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="flex-1 justify-start"
                disabled={!isDateWithinLimits(today, minDate, maxDate)}
                onClick={() => selectDate(today)}
              >
                Today
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="flex-1 justify-start"
                disabled={!isDateWithinLimits(yesterday, minDate, maxDate)}
                onClick={() => selectDate(yesterday)}
              >
                Yesterday
              </Button>
            </div>
            <Calendar
              mode="single"
              captionLayout="dropdown"
              defaultMonth={selectedDate ?? today}
              startMonth={minDate ?? new Date(today.getFullYear() - 100, 0)}
              endMonth={maxDate ?? new Date(today.getFullYear() + 20, 11)}
              selected={selectedDate}
              disabled={disabledDates}
              onSelect={(date) => {
                if (date) selectDate(date);
              }}
            />
          </div>
        </PopoverContent>
      </Popover>
    );
  },
);

function formatTimeLabel(value?: string) {
  if (!value || !TIME_VALUE_PATTERN.test(value)) return undefined;
  return format(parse(value, "HH:mm", new Date()), "p");
}

function isTimeWithinLimits(
  value: string,
  min?: string | number,
  max?: string | number,
) {
  const minValue = typeof min === "string" ? min : undefined;
  const maxValue = typeof max === "string" ? max : undefined;
  return (!minValue || value >= minValue) && (!maxValue || value <= maxValue);
}

const TimePickerInput = forwardRef<HTMLButtonElement, TimePickerInputProps>(
  function TimePickerInput(
    {
      id,
      name,
      value,
      placeholder = "Pick a time",
      disabled,
      required,
      "aria-invalid": invalid,
      className,
      min,
      max,
      step = 60,
      onBlur,
      onValueChange,
    },
    ref,
  ) {
    const [open, setOpen] = useState(false);
    const timeLabel = formatTimeLabel(value);
    const timeOptions = useMemo(
      () =>
        Array.from({ length: 48 }, (_, index) => {
          const hours = Math.floor(index / 2);
          const minutes = index % 2 === 0 ? "00" : "30";
          return `${hours.toString().padStart(2, "0")}:${minutes}`;
        }).filter((time) => isTimeWithinLimits(time, min, max)),
      [max, min],
    );

    const selectTime = (time: string) => {
      onValueChange(time);
      setOpen(false);
    };

    const selectCurrentTime = () => {
      const now = new Date();
      selectTime(
        `${now.getHours().toString().padStart(2, "0")}:${now
          .getMinutes()
          .toString()
          .padStart(2, "0")}`,
      );
    };

    return (
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) onBlur?.();
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
            aria-label={timeLabel ? undefined : placeholder}
            onBlur={onBlur}
            className={cn(
              "w-full justify-start font-normal",
              !timeLabel && "text-muted-foreground",
              className,
            )}
          >
            <ClockIcon data-icon="inline-start" />
            {timeLabel ?? placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 gap-3">
          <div className="flex gap-2">
            <Input
              type="time"
              value={value ?? ""}
              min={min}
              max={max}
              step={step}
              aria-label="Enter an exact time"
              onChange={(event) => onValueChange(event.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              disabled={
                !isTimeWithinLimits(
                  `${new Date().getHours().toString().padStart(2, "0")}:${new Date()
                    .getMinutes()
                    .toString()
                    .padStart(2, "0")}`,
                  min,
                  max,
                )
              }
              onClick={selectCurrentTime}
            >
              Now
            </Button>
          </div>
          <div
            className="grid max-h-56 grid-cols-3 gap-1 overflow-y-auto"
            role="listbox"
            aria-label="Common times"
          >
            {timeOptions.map((time) => (
              <Button
                key={time}
                type="button"
                size="sm"
                variant={value === time ? "secondary" : "ghost"}
                role="option"
                aria-selected={value === time}
                className="justify-between"
                onClick={() => selectTime(time)}
              >
                {formatTimeLabel(time)}
                {value === time ? <CheckIcon data-icon="inline-end" /> : null}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  },
);

export { DatePickerInput, TimePickerInput };
export type { DatePickerInputProps, TimePickerInputProps };

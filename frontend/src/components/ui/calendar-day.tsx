"use client";

import {
  endOfMonth,
  endOfYear,
  format,
  isAfter,
  isBefore,
  isValid,
  parse,
  startOfDay,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from "date-fns";
import { CalendarIcon, CheckIcon, ClockIcon } from "lucide-react";
import {
  forwardRef,
  type ReactNode,
  useMemo,
  useState,
} from "react";
import type { DateRange } from "react-day-picker";

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

type BasePickerProps = {
  id?: string;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  "aria-invalid"?: boolean;
  className?: string;
  onBlur?: () => void;
};

type PickerProps = BasePickerProps & {
  value?: string;
  onValueChange: (value: string) => void;
};

type DatePickerInputProps = PickerProps & {
  min?: string | number;
  max?: string | number;
  align?: "start" | "center" | "end";
  displayValue?: ReactNode;
};

type TimePickerInputProps = PickerProps & {
  min?: string | number;
  max?: string | number;
  step?: string | number;
};

type DateRangeValue = {
  from?: string;
  to?: string;
};

type DateRangePickerInputProps = BasePickerProps & {
  value?: DateRangeValue;
  min?: string | number;
  max?: string | number;
  align?: "start" | "center" | "end";
  displayValue?: ReactNode;

  /**
   * Number of calendar months displayed inside the popover.
   * This is different from the custom "Last N months" input.
   */
  calendarMonths?: number;

  onValueChange: (value: DateRangeValue) => void;
};

function parseDateValue(value?: string | number) {
  if (typeof value !== "string" || !value) {
    return undefined;
  }

  const parsedDate = parse(value, DATE_VALUE_FORMAT, new Date());

  return isValid(parsedDate) ? startOfDay(parsedDate) : undefined;
}

function isDateWithinLimits(
  date: Date,
  minDate?: Date,
  maxDate?: Date,
) {
  return !(
    (minDate && isBefore(date, minDate)) ||
    (maxDate && isAfter(date, maxDate))
  );
}

/**
 * Intersects a date range with the minimum and maximum limits.
 *
 * For example, if the selected range starts before minDate,
 * the returned range starts from minDate instead.
 */
function restrictDateRange(
  range: DateRange,
  minDate?: Date,
  maxDate?: Date,
): DateRange | undefined {
  if (!range.from) {
    return undefined;
  }

  const originalFrom = startOfDay(range.from);
  const originalTo = startOfDay(range.to ?? range.from);

  // The entire range is before the minimum date.
  if (minDate && isBefore(originalTo, minDate)) {
    return undefined;
  }

  // The entire range is after the maximum date.
  if (maxDate && isAfter(originalFrom, maxDate)) {
    return undefined;
  }

  const from =
    minDate && isBefore(originalFrom, minDate)
      ? minDate
      : originalFrom;

  const to =
    maxDate && isAfter(originalTo, maxDate)
      ? maxDate
      : originalTo;

  if (isAfter(from, to)) {
    return undefined;
  }

  return { from, to };
}

function formatDateRangeLabel(
  range?: DateRange,
  placeholder = "Pick a date range",
) {
  if (!range?.from) {
    return placeholder;
  }

  if (!range.to) {
    return `${format(range.from, "MMM d, yyyy")} – Pick end date`;
  }

  if (range.from.getTime() === range.to.getTime()) {
    return format(range.from, "PPP");
  }

  return `${format(range.from, "MMM d, yyyy")} – ${format(
    range.to,
    "MMM d, yyyy",
  )}`;
}

/* -------------------------------------------------------------------------- */
/*                            SINGLE DATE PICKER                              */
/* -------------------------------------------------------------------------- */

const DatePickerInput = forwardRef<
  HTMLButtonElement,
  DatePickerInputProps
>(function DatePickerInput(
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
    align = "start",
    displayValue,
    onBlur,
    onValueChange,
  },
  ref,
) {
  const [open, setOpen] = useState(false);

  const selectedDate = parseDateValue(value);
  const minDate = parseDateValue(min);
  const maxDate = parseDateValue(max);

  const today = startOfDay(new Date());
  const yesterday = subDays(today, 1);

  const [month, setMonth] = useState(selectedDate ?? today);

  const disabledDates = [
    ...(minDate ? [{ before: minDate }] : []),
    ...(maxDate ? [{ after: maxDate }] : []),
  ];

  const selectDate = (date: Date) => {
    if (!isDateWithinLimits(date, minDate, maxDate)) {
      return;
    }

    onValueChange(format(date, DATE_VALUE_FORMAT));
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (nextOpen) {
          setMonth(selectedDate ?? today);
        }

        if (!nextOpen) {
          onBlur?.();
        }
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
          className={cn(
            "w-full justify-start font-normal",
            !selectedDate && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="size-4" />

          {selectedDate
            ? (displayValue ?? format(selectedDate, "PPP"))
            : placeholder}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align={align}
        className="w-auto rounded-md p-0"
      >
        <div className="flex max-sm:flex-col">
          <div className="flex gap-1 border-b p-2 sm:w-32 sm:flex-col sm:border-r sm:border-b-0">
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
              disabled={
                !isDateWithinLimits(yesterday, minDate, maxDate)
              }
              onClick={() => selectDate(yesterday)}
            >
              Yesterday
            </Button>
          </div>

          <Calendar
            mode="single"
            captionLayout="dropdown"
            month={month}
            onMonthChange={setMonth}
            startMonth={
              minDate ?? new Date(today.getFullYear() - 100, 0)
            }
            endMonth={
              maxDate ?? new Date(today.getFullYear() + 20, 11)
            }
            selected={selectedDate}
            disabled={disabledDates}
            onSelect={(date) => {
              if (date) {
                selectDate(date);
              }
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
});

/* -------------------------------------------------------------------------- */
/*                             DATE RANGE PICKER                              */
/* -------------------------------------------------------------------------- */

const DateRangePickerInput = forwardRef<
  HTMLButtonElement,
  DateRangePickerInputProps
>(function DateRangePickerInput(
  {
    id,
    name,
    value,
    placeholder = "Pick a date range",
    disabled,
    required,
    "aria-invalid": invalid,
    className,
    min,
    max,
    align = "start",
    displayValue,
    calendarMonths = 2,
    onBlur,
    onValueChange,
  },
  ref,
) {
  const [open, setOpen] = useState(false);
  const [customMonths, setCustomMonths] = useState("3");

  const today = startOfDay(new Date());
  const minDate = parseDateValue(min);
  const maxDate = parseDateValue(max);

  const selectedRange: DateRange | undefined = value?.from
    ? {
        from: parseDateValue(value.from),
        to: parseDateValue(value.to),
      }
    : undefined;

  const [draftRange, setDraftRange] = useState<
    DateRange | undefined
  >(selectedRange);

  const [month, setMonth] = useState(
    selectedRange?.from ?? today,
  );

  const disabledDates = [
    ...(minDate ? [{ before: minDate }] : []),
    ...(maxDate ? [{ after: maxDate }] : []),
  ];

  const applyRange = (range: DateRange) => {
    const restrictedRange = restrictDateRange(
      range,
      minDate,
      maxDate,
    );

    if (!restrictedRange?.from) {
      return;
    }

    const finalTo = restrictedRange.to ?? restrictedRange.from;

    onValueChange({
      from: format(restrictedRange.from, DATE_VALUE_FORMAT),
      to: format(finalTo, DATE_VALUE_FORMAT),
    });

    setDraftRange({
      from: restrictedRange.from,
      to: finalTo,
    });

    setMonth(restrictedRange.from);
    setOpen(false);
  };

  const clearRange = () => {
    onValueChange({
      from: undefined,
      to: undefined,
    });

    setDraftRange(undefined);
    setMonth(today);
    setOpen(false);
  };

  const selectToday = () => {
    applyRange({
      from: today,
      to: today,
    });
  };

  const selectYesterday = () => {
    const yesterday = subDays(today, 1);

    applyRange({
      from: yesterday,
      to: yesterday,
    });
  };

  const selectLastWeek = () => {
    applyRange({
      from: subDays(today, 6),
      to: today,
    });
  };

  const selectLastMonth = () => {
    const previousMonth = subMonths(today, 1);

    applyRange({
      from: startOfMonth(previousMonth),
      to: endOfMonth(previousMonth),
    });
  };

  const selectLastYear = () => {
    const previousYear = subYears(today, 1);

    applyRange({
      from: startOfYear(previousYear),
      to: endOfYear(previousYear),
    });
  };

  const selectCustomMonths = () => {
    const parsedMonths = Number.parseInt(customMonths, 10);

    if (!Number.isFinite(parsedMonths) || parsedMonths < 1) {
      return;
    }

    // Prevent accidental extremely large date ranges.
    const months = Math.min(parsedMonths, 120);

    applyRange({
      from: subMonths(today, months),
      to: today,
    });
  };

  const applySelectedCalendarDates = () => {
    if (!draftRange?.from) {
      return;
    }

    /*
     * When only one calendar date is selected,
     * use it as both the start and end date.
     */
    applyRange({
      from: draftRange.from,
      to: draftRange.to ?? draftRange.from,
    });
  };

  const label = formatDateRangeLabel(
    selectedRange,
    placeholder,
  );

  return (
    <>
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);

          if (nextOpen) {
            setDraftRange(selectedRange);
            setMonth(selectedRange?.from ?? today);
          }

          if (!nextOpen) {
            onBlur?.();
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-invalid={invalid}
            aria-required={required}
            aria-label={selectedRange?.from ? undefined : placeholder}
            className={cn(
              "w-full justify-start font-normal",
              !selectedRange?.from && "text-muted-foreground",
              className,
            )}
          >
            <CalendarIcon className="size-4 shrink-0" />

            <span className="truncate">
              {selectedRange?.from
                ? (displayValue ?? label)
                : placeholder}
            </span>
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align={align}
          className="max-w-[calc(100vw-2rem)] overflow-x-auto rounded-md p-0"
        >
          <div className="flex max-sm:flex-col">
            <div className="border-b p-2 sm:w-44 sm:border-r sm:border-b-0">
              <div className="grid gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={selectToday}
                >
                  Today
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={selectYesterday}
                >
                  Yesterday
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={selectLastWeek}
                >
                  Last week
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={selectLastMonth}
                >
                  Last month
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={selectLastYear}
                >
                  Last year
                </Button>
              </div>

              <div className="mt-2 border-t pt-3">
                <p className="mb-2 text-xs font-medium">
                  Last number of months
                </p>

                <div className="flex gap-1">
                  <Input
                    type="number"
                    min={1}
                    max={120}
                    value={customMonths}
                    disabled={disabled}
                    aria-label="Number of previous months"
                    className="h-8 min-w-0"
                    onChange={(event) =>
                      setCustomMonths(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        selectCustomMonths();
                      }
                    }}
                  />

                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-8"
                    disabled={
                      !customMonths ||
                      Number(customMonths) < 1 ||
                      Number(customMonths) > 120
                    }
                    onClick={selectCustomMonths}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <Calendar
                mode="range"
                captionLayout="dropdown"
                numberOfMonths={calendarMonths}
                month={month}
                onMonthChange={setMonth}
                startMonth={
                  minDate ??
                  new Date(today.getFullYear() - 100, 0)
                }
                endMonth={
                  maxDate ??
                  new Date(today.getFullYear() + 20, 11)
                }
                selected={draftRange}
                disabled={disabledDates}
                onSelect={setDraftRange}
                className="p-2"
              />

              <div className="flex items-center justify-between gap-2 border-t p-2">
                <p className="hidden text-xs text-muted-foreground sm:block">
                  Select one date or a start and end date.
                </p>

                <div className="ml-auto flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={required || !selectedRange?.from}
                    onClick={clearRange}
                  >
                    Clear
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    disabled={!draftRange?.from}
                    onClick={applySelectedCalendarDates}
                  >
                    Apply dates
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {name ? (
        <>
          <input
            type="hidden"
            name={`${name}.from`}
            value={value?.from ?? ""}
          />

          <input
            type="hidden"
            name={`${name}.to`}
            value={value?.to ?? ""}
          />
        </>
      ) : null}
    </>
  );
});

/* -------------------------------------------------------------------------- */
/*                                TIME PICKER                                 */
/* -------------------------------------------------------------------------- */

function formatTimeLabel(value?: string) {
  if (!value || !TIME_VALUE_PATTERN.test(value)) {
    return undefined;
  }

  return format(parse(value, "HH:mm", new Date()), "p");
}

function isTimeWithinLimits(
  value: string,
  min?: string | number,
  max?: string | number,
) {
  const minValue = typeof min === "string" ? min : undefined;
  const maxValue = typeof max === "string" ? max : undefined;

  return (
    (!minValue || value >= minValue) &&
    (!maxValue || value <= maxValue)
  );
}

const TimePickerInput = forwardRef<
  HTMLButtonElement,
  TimePickerInputProps
>(function TimePickerInput(
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

        return `${hours
          .toString()
          .padStart(2, "0")}:${minutes}`;
      }).filter((time) => isTimeWithinLimits(time, min, max)),
    [max, min],
  );

  const selectTime = (time: string) => {
    onValueChange(time);
    setOpen(false);
  };

  const getCurrentTime = () => {
    const now = new Date();

    return `${now
      .getHours()
      .toString()
      .padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  const selectCurrentTime = () => {
    selectTime(getCurrentTime());
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) {
          onBlur?.();
        }
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
          className={cn(
            "w-full justify-start font-normal",
            !timeLabel && "text-muted-foreground",
            className,
          )}
        >
          <ClockIcon className="size-4" />
          {timeLabel ?? placeholder}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-72 gap-3 rounded-md"
      >
        <div className="flex gap-2">
          <Input
            type="time"
            value={value ?? ""}
            min={min}
            max={max}
            step={step}
            aria-label="Enter an exact time"
            onChange={(event) =>
              onValueChange(event.target.value)
            }
          />

          <Button
            type="button"
            variant="outline"
            disabled={
              !isTimeWithinLimits(getCurrentTime(), min, max)
            }
            onClick={selectCurrentTime}
          >
            Now
          </Button>
        </div>

        <fieldset
          className="grid max-h-56 grid-cols-3 gap-1 overflow-y-auto"
          aria-label="Common times"
        >
          {timeOptions.map((time) => (
            <Button
              key={time}
              type="button"
              size="sm"
              variant={value === time ? "secondary" : "ghost"}
              aria-pressed={value === time}
              className="justify-between"
              onClick={() => selectTime(time)}
            >
              {formatTimeLabel(time)}

              {value === time ? (
                <CheckIcon className="size-4" />
              ) : null}
            </Button>
          ))}
        </fieldset>
      </PopoverContent>
    </Popover>
  );
});

export {
  DatePickerInput,
  DateRangePickerInput,
  TimePickerInput,
};

export type {
  DatePickerInputProps,
  DateRangePickerInputProps,
  DateRangeValue,
  TimePickerInputProps,
};

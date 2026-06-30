"use client";

import {
  type ComponentProps,
  type HTMLInputTypeAttribute,
  type ReactNode,
  useId,
} from "react";
import {
  type Control,
  Controller,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { MoneyInput } from "@/components/common/form/money-input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type CommonFormOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type CommonFormFieldType =
  | "input"
  | "select"
  | "textarea"
  | "checkbox"
  | "date"
  | "time"
  | "money"
  | "phone"
  | "otp-input"
  | "custom";

interface CommonFormFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: ReactNode;
  placeholder?: string;
  description?: ReactNode;
  disabled?: boolean;
  required?: boolean;
  type?: HTMLInputTypeAttribute;
  fieldType?: CommonFormFieldType;
  currency?: string;
  className?: string;
  fieldClassName?: string;
  selectOptions?: CommonFormOption[];
  inputProps?: Omit<
    ComponentProps<typeof Input>,
    "aria-invalid" | "disabled" | "id" | "onChange" | "type" | "value"
  >;
  textareaProps?: Omit<
    ComponentProps<typeof Textarea>,
    "aria-invalid" | "disabled" | "id" | "onChange" | "value"
  >;
  otpLength?: number;
  render?: (props: {
    field: ControllerRenderProps<T, FieldPath<T>>;
    id: string;
    invalid: boolean;
    disabled: boolean;
  }) => ReactNode;
}

export function CommonFormField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder = "",
  disabled = false,
  required = false,
  type = "text",
  fieldType = "input",
  selectOptions = [],
  description,
  className,
  fieldClassName,
  currency,
  render,
  inputProps,
  textareaProps,
  otpLength = 6,
}: CommonFormFieldProps<T>) {
  const generatedId = useId();
  const id = `${name}-${generatedId}`;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const invalid = Boolean(fieldState.error);
        const stringValue = field.value?.toString() ?? "";

        const renderControl = () => {
          switch (fieldType) {
            case "textarea":
              return (
                <Textarea
                  id={id}
                  disabled={disabled}
                  placeholder={placeholder}
                  value={stringValue}
                  aria-invalid={invalid}
                  className={className}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  {...textareaProps}
                />
              );

            case "select":
              return (
                <Select
                  value={stringValue}
                  onValueChange={field.onChange}
                  disabled={disabled}
                  name={field.name}
                >
                  <SelectTrigger
                    id={id}
                    className={cn("w-full", className)}
                    aria-invalid={invalid}
                    onBlur={field.onBlur}
                    ref={field.ref}
                  >
                    <SelectValue placeholder={placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {selectOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          disabled={option.disabled}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              );

            case "checkbox":
              return (
                <Checkbox
                  id={id}
                  name={field.name}
                  disabled={disabled}
                  checked={Boolean(field.value)}
                  aria-invalid={invalid}
                  className={className}
                  onBlur={field.onBlur}
                  onCheckedChange={field.onChange}
                  ref={field.ref}
                />
              );

            case "date":
            case "time":
            case "phone":
              return (
                <Input
                  id={id}
                  name={field.name}
                  type={
                    fieldType === "phone"
                      ? "tel"
                      : (fieldType as HTMLInputTypeAttribute)
                  }
                  disabled={disabled}
                  placeholder={placeholder}
                  value={stringValue}
                  aria-invalid={invalid}
                  className={className}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  {...inputProps}
                />
              );

            case "money":
              return (
                <MoneyInput
                  id={id}
                  name={field.name}
                  currency={currency ?? "RWF"}
                  disabled={disabled}
                  placeholder={placeholder}
                  value={field.value}
                  aria-invalid={invalid}
                  className={className}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  {...inputProps}
                />
              );

            case "otp-input": {
              const firstSlotCount = Math.ceil(otpLength / 2);
              const otpSlots = Array.from(
                { length: otpLength },
                (_, slotIndex) => ({
                  key: `otp-slot-${slotIndex}`,
                  index: slotIndex,
                }),
              );
              const firstSlots = otpSlots.slice(0, firstSlotCount);
              const secondSlots = otpSlots.slice(firstSlotCount);

              return (
                <InputOTP
                  id={id}
                  name={field.name}
                  maxLength={otpLength}
                  value={stringValue}
                  disabled={disabled}
                  aria-invalid={invalid}
                  aria-label={typeof label === "string" ? label : undefined}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                >
                  <InputOTPGroup>
                    {firstSlots.map((slot) => (
                      <InputOTPSlot key={slot.key} index={slot.index} />
                    ))}
                  </InputOTPGroup>
                  {secondSlots.length ? <InputOTPSeparator /> : null}
                  {secondSlots.length ? (
                    <InputOTPGroup>
                      {secondSlots.map((slot) => (
                        <InputOTPSlot key={slot.key} index={slot.index} />
                      ))}
                    </InputOTPGroup>
                  ) : null}
                </InputOTP>
              );
            }

            case "custom":
              return render ? (
                render({ field, disabled, id, invalid })
              ) : (
                <FieldError>Custom fields require a render prop.</FieldError>
              );

            default:
              return (
                <Input
                  id={id}
                  name={field.name}
                  type={type}
                  disabled={disabled}
                  placeholder={placeholder}
                  value={stringValue}
                  aria-invalid={invalid}
                  className={className}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  {...inputProps}
                />
              );
          }
        };

        return (
          <Field
            data-invalid={invalid}
            data-disabled={disabled}
            orientation={fieldType === "checkbox" ? "horizontal" : "vertical"}
            className={fieldClassName}
          >
            {fieldType === "checkbox" ? renderControl() : null}
            <FieldLabel htmlFor={id}>
              {label}
              {required ? <span className="text-destructive">*</span> : null}
            </FieldLabel>
            {fieldType === "checkbox" ? null : renderControl()}
            {description ? (
              <FieldDescription>{description}</FieldDescription>
            ) : null}
            <FieldError errors={[fieldState.error]} />
          </Field>
        );
      }}
    />
  );
}

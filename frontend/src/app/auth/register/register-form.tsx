"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

export type RegisterFormCopy = {
  firstNameLabel: string;
  lastNameLabel: string;
  genderLabel: string;
  genderPlaceholder: string;
  emailLabel: string;
  phoneLabel: string;
  contactHint: string;
  passwordLabel: string;
  legal: string;
  submitLabel: string;
  pendingLabel: string;
  haveAccount: string;
  success: string;
  genericError: string;
  genderOptions: Array<{
    value: string;
    label: string;
  }>;
};

type ApiErrorResponse = {
  message?: string | string[];
  error?: {
    message?: string;
  };
};

const getRegisterUrl = () => {
  const configuredUrl =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://localhost:3000";
  const baseUrl = configuredUrl.replace(/\/$/, "");

  if (baseUrl.endsWith("/api/v1")) {
    return `${baseUrl}/auth/register`;
  }

  return `${baseUrl}/api/v1/auth/register`;
};

const getErrorMessage = (payload: ApiErrorResponse, genericError: string) => {
  if (payload.error?.message) {
    return payload.error.message;
  }

  if (Array.isArray(payload.message)) {
    return payload.message[0] ?? genericError;
  }

  return payload.message ?? genericError;
};

const inputClassName =
  "h-14 rounded-[1.125rem] border-input/80 bg-background/70 px-5 text-[0.95rem] shadow-none placeholder:text-muted-foreground";

type RegisterFormProps = {
  copy: RegisterFormCopy;
  loginHref: string;
};

export const RegisterForm = ({ copy, loginHref }: RegisterFormProps) => {
  const [gender, setGender] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phoneNumber = String(formData.get("phoneNumber") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      const response = await fetch(getRegisterUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          firstName,
          lastName,
          gender,
          email,
          phoneNumber,
          password,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as
        | ApiErrorResponse
        | undefined;

      if (!response.ok) {
        setError(getErrorMessage(payload ?? {}, copy.genericError));
        return;
      }

      setSuccessMessage(copy.success);
    } catch {
      setError(copy.genericError);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <FieldGroup className="gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={Boolean(error)}>
            <FieldLabel htmlFor="firstName" className="sr-only">
              {copy.firstNameLabel}
            </FieldLabel>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
              maxLength={80}
              placeholder={copy.firstNameLabel}
              aria-invalid={Boolean(error)}
              className={inputClassName}
            />
          </Field>

          <Field data-invalid={Boolean(error)}>
            <FieldLabel htmlFor="lastName" className="sr-only">
              {copy.lastNameLabel}
            </FieldLabel>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              maxLength={80}
              placeholder={copy.lastNameLabel}
              aria-invalid={Boolean(error)}
              className={inputClassName}
            />
          </Field>
        </div>

        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="gender">{copy.genderLabel}</FieldLabel>
          <Select
            value={gender}
            onValueChange={setGender}
            name="gender"
            required
          >
            <SelectTrigger
              id="gender"
              aria-invalid={Boolean(error)}
              className={`w-full justify-between ${inputClassName}`}
            >
              <SelectValue placeholder={copy.genderPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {copy.genderOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="email">{copy.emailLabel}</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            placeholder={copy.emailLabel}
            aria-invalid={Boolean(error)}
            className={inputClassName}
          />
        </Field>

        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="phoneNumber">{copy.phoneLabel}</FieldLabel>
          <Input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            autoComplete="tel"
            required
            minLength={7}
            maxLength={20}
            placeholder={copy.phoneLabel}
            aria-invalid={Boolean(error)}
            className={inputClassName}
          />
          <FieldDescription>{copy.contactHint}</FieldDescription>
        </Field>

        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="password">{copy.passwordLabel}</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            placeholder={copy.passwordLabel}
            aria-invalid={Boolean(error)}
            className={inputClassName}
          />
          <FieldError>{error}</FieldError>
        </Field>
      </FieldGroup>

      <p className="text-xs leading-relaxed text-muted-foreground">
        {copy.legal}
      </p>

      <div className="flex flex-col items-center gap-3">
        <Button
          type="submit"
          size="lg"
          disabled={isPending}
          className="h-12 w-full rounded-full text-sm font-semibold"
        >
          {isPending ? (
            <>
              <Spinner data-icon="inline-start" />
              {copy.pendingLabel}
            </>
          ) : (
            copy.submitLabel
          )}
        </Button>

        <Button
          href={loginHref}
          variant="outline"
          className="h-12 w-full rounded-full text-sm font-semibold"
        >
          {copy.haveAccount}
        </Button>
      </div>

      <FieldDescription aria-live="polite" className="text-center">
        {successMessage}
      </FieldDescription>
    </form>
  );
};

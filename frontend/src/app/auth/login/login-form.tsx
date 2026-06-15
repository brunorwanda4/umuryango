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
import { Spinner } from "@/components/ui/spinner";

export type LoginFormCopy = {
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  submitLabel: string;
  pendingLabel: string;
  forgotPassword: string;
  success: string;
  genericError: string;
};

type ApiErrorResponse = {
  message?: string | string[];
  error?: {
    message?: string;
  };
};

const getLoginUrl = () => {
  const configuredUrl =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://localhost:3000";
  const baseUrl = configuredUrl.replace(/\/$/, "");

  if (baseUrl.endsWith("/api/v1")) {
    return `${baseUrl}/auth/login`;
  }

  return `${baseUrl}/api/v1/auth/login`;
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

type LoginFormProps = {
  copy: LoginFormCopy;
  forgotPasswordHref: string;
};

export const LoginForm = ({ copy, forgotPasswordHref }: LoginFormProps) => {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const emailOrMobile = String(formData.get("emailOrMobile") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      const response = await fetch(getLoginUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ emailOrMobile, password }),
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
      <FieldGroup className="gap-4">
        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="emailOrMobile" className="sr-only">
            {copy.emailLabel}
          </FieldLabel>
          <Input
            id="emailOrMobile"
            name="emailOrMobile"
            type="text"
            autoComplete="username"
            required
            minLength={3}
            maxLength={254}
            placeholder={copy.emailPlaceholder}
            aria-invalid={Boolean(error)}
            className="h-14 rounded-[1.125rem] border-input/80 bg-background/70 px-5 text-[0.95rem] shadow-none placeholder:text-muted-foreground"
          />
        </Field>

        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="password" className="sr-only">
            {copy.passwordLabel}
          </FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            maxLength={128}
            placeholder={copy.passwordPlaceholder}
            aria-invalid={Boolean(error)}
            className="h-14 rounded-[1.125rem] border-input/80 bg-background/70 px-5 text-[0.95rem] shadow-none placeholder:text-muted-foreground"
          />
          <FieldError>{error}</FieldError>
        </Field>
      </FieldGroup>

      <div className="flex flex-col items-center gap-5">
        <Button
          type="submit"
          size="lg"
          disabled={isPending}
          className="h-11 w-full rounded-full text-sm font-semibold"
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

        <Button href={forgotPasswordHref} variant="link" className="text-sm">
          {copy.forgotPassword}
        </Button>
      </div>

      <FieldDescription aria-live="polite" className="text-center">
        {successMessage}
      </FieldDescription>
    </form>
  );
};

"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent, PointerEvent } from "react";
import { useRef, useState } from "react";
import { GoogleIcon } from "@/components/icons/google-icon";
import { Button } from "@/components/ui/button";
import {
  FieldDescription,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import { FloatingField } from "@/components/ui/floating-field";
import { Spinner } from "@/components/ui/spinner";
import apiRequest, { getApiAuthUrl } from "@/service/api";

export type LoginFormCopy = {
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  submitLabel: string;
  pendingLabel: string;
  forgotPassword: string;
  continueWithGoogle: string;
  success: string;
  genericError: string;
  showPasswordLabel: string;
  hidePasswordLabel: string;
};

type LoginFormProps = {
  copy: LoginFormCopy;
  forgotPasswordHref: string;
  postLoginHref: string;
};

const identifierBoundaryCharacters = /^[`'"]+|[`'"]+$/g;

function normalizeLoginIdentifier(value: string) {
  return value.trim().replace(identifierBoundaryCharacters, "");
}

export const LoginForm = ({
  copy,
  forgotPasswordHref,
  postLoginHref,
}: LoginFormProps) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const skipPasswordToggleClickRef = useRef(false);

  const passwordToggleLabel = isPasswordVisible
    ? copy.hidePasswordLabel
    : copy.showPasswordLabel;
  const PasswordIcon = isPasswordVisible ? EyeOffIcon : EyeIcon;
  const togglePasswordVisibility = () => {
    const nextIsPasswordVisible = !isPasswordVisible;
    setIsPasswordVisible(nextIsPasswordVisible);

    const passwordInput = document.getElementById("password");

    if (passwordInput instanceof HTMLInputElement) {
      passwordInput.type = nextIsPasswordVisible ? "text" : "password";
      window.requestAnimationFrame(() => {
        passwordInput.focus({ preventScroll: true });

        const caretPosition = passwordInput.value.length;
        passwordInput.setSelectionRange(caretPosition, caretPosition);
      });
    }
  };
  const handlePasswordTogglePointerDown = (
    event: PointerEvent<HTMLButtonElement>,
  ) => {
    if (event.pointerType === "mouse") return;

    event.preventDefault();
    skipPasswordToggleClickRef.current = true;
    togglePasswordVisibility();
  };
  const handlePasswordToggleClick = () => {
    if (skipPasswordToggleClickRef.current) {
      skipPasswordToggleClickRef.current = false;
      return;
    }

    togglePasswordVisibility();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const emailOrMobile = normalizeLoginIdentifier(
      String(formData.get("emailOrMobile") ?? ""),
    );
    const password = String(formData.get("password") ?? "");

    const response = await apiRequest("post", "/auth/login", {
      emailOrMobile,
      password,
    });

    if (!response.ok) {
      setError(
        response.statusCode === 0
          ? copy.genericError
          : (response.message ?? copy.genericError),
      );
      setIsPending(false);
      return;
    }

    setSuccessMessage(copy.success);
    router.push(postLoginHref);
    setIsPending(false);
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <FieldGroup className="gap-4">
        <FloatingField
          id="emailOrMobile"
          name="emailOrMobile"
          type="text"
          label={copy.emailPlaceholder}
          autoComplete="username"
          required
          minLength={3}
          maxLength={254}
          aria-invalid={Boolean(error)}
        />

        <div className="flex flex-col gap-1.5">
          <FloatingField
            id="password"
            name="password"
            type={isPasswordVisible ? "text" : "password"}
            label={copy.passwordPlaceholder}
            autoComplete="current-password"
            required
            minLength={8}
            maxLength={128}
            aria-invalid={Boolean(error)}
            trailingSlot={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={passwordToggleLabel}
                aria-pressed={isPasswordVisible}
                onPointerDown={handlePasswordTogglePointerDown}
                onClick={handlePasswordToggleClick}
                className="hidden rounded-full text-muted-foreground hover:text-foreground sm:inline-flex"
              >
                <PasswordIcon aria-hidden="true" />
              </Button>
            }
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-pressed={isPasswordVisible}
            onPointerDown={handlePasswordTogglePointerDown}
            onClick={handlePasswordToggleClick}
            className="h-9 w-fit self-end rounded-full px-3 text-muted-foreground hover:text-foreground sm:hidden"
          >
            <PasswordIcon data-icon="inline-start" aria-hidden="true" />
            {passwordToggleLabel}
          </Button>
          <FieldError>{error}</FieldError>
        </div>
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

        <Button
          asChild
          variant="outline"
          size="lg"
          className="h-11 w-full rounded-full text-sm font-semibold"
        >
          <a href={getApiAuthUrl("google")}>
            <GoogleIcon data-icon="inline-start" />
            {copy.continueWithGoogle}
          </a>
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

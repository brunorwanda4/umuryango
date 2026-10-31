"use client";

import {
  AlertCircleIcon,
  CheckCircle2Icon,
  KeyRoundIcon,
  MailCheckIcon,
  RefreshCwIcon,
  UserRoundIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { CommonFormField } from "@/components/common/form/common-form-field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  type CurrentUser,
  publishCurrentUserUpdate,
} from "@/hooks/use-current-user";
import { useZodFormSubmit } from "@/hooks/use-zod-form-submit";
import { createTranslator, type Translator } from "@/i18n/translate";
import apiRequest from "@/service/api";

const createProfileSchema = (t: Translator) =>
  z.object({
    fullName: z.string().trim().min(2, t("validation.nameMin")).max(160),
    email: z.string().trim().email(t("validation.emailInvalid")).max(254),
    phoneNumber: z
      .string()
      .trim()
      .refine(
        (value) => !value || /^\+?[0-9][0-9\s()-]{6,19}$/.test(value),
        t("validation.phoneInvalid"),
      ),
    gender: z.enum(["female", "male", "custom", "unspecified"]),
  });

type ProfileFormValues = {
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  gender: "female" | "male" | "custom" | "unspecified";
};

type UpdateProfileResponse = {
  user: CurrentUser;
  requiresEmailVerification: boolean;
  verificationEmail: string | null;
};

export function PersonalProfileSettings({ user }: { user: CurrentUser }) {
  const t = createTranslator("PersonalSettings");
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [pendingEmail, setPendingEmail] = useState(user.pendingEmail);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationError, setVerificationError] = useState<string>();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const profileSchema = useMemo(() => createProfileSchema(t), [t]);
  const genderOptions = useMemo(
    () => [
      { value: "female", label: t("genderOptions.female") },
      { value: "male", label: t("genderOptions.male") },
      { value: "custom", label: t("genderOptions.custom") },
      { value: "unspecified", label: t("genderOptions.unspecified") },
    ],
    [t],
  );

  const { form, onSubmit, error, success, isPending } = useZodFormSubmit<
    ProfileFormValues,
    UpdateProfileResponse
  >({
    schema: profileSchema,
    formOptions: {
      defaultValues: {
        fullName: user.fullName,
        email: user.pendingEmail ?? user.email,
        phoneNumber: user.phoneNumber ?? "",
        gender: isGenderValue(user.gender) ? user.gender : "unspecified",
      },
    },
    request: { method: "patch", url: "/auth/me" },
    transform: (values) => ({
      ...values,
      phoneNumber: values.phoneNumber || null,
      gender: values.gender === "unspecified" ? null : values.gender,
    }),
    onSuccessMessage: t("profileUpdated"),
    toastOnSuccess: true,
    toastOnError: true,
    onSuccess: (data) => {
      setPendingEmail(data?.verificationEmail ?? null);
      setVerificationCode("");
      setVerificationError(undefined);
    },
  });

  useEffect(() => {
    if (success) form.reset(form.getValues());
  }, [form, success]);

  const verifyEmail = async () => {
    if (!pendingEmail || verificationCode.length !== 6) return;
    setIsVerifying(true);
    setVerificationError(undefined);

    const response = await apiRequest("post", "/auth/verify-email", {
      email: pendingEmail,
      code: verificationCode,
    });

    if (!response.ok) {
      setVerificationError(response.message ?? t("verification.confirmFailed"));
      setIsVerifying(false);
      return;
    }

    toast.success(t("verification.verifiedSuccess"));
    setPendingEmail(null);
    setVerificationCode("");
    setIsVerifying(false);
    router.refresh();
  };

  const resendCode = async () => {
    if (!pendingEmail) return;
    setIsResending(true);
    setVerificationError(undefined);

    const response = await apiRequest("post", "/auth/resend-verification", {
      email: pendingEmail,
    });

    if (!response.ok) {
      setVerificationError(response.message ?? t("verification.sendFailed"));
    } else {
      toast.success(t("verification.codeSent"));
    }

    setIsResending(false);
  };

  const updateAvatar = async () => {
    setIsUpdatingAvatar(true);
    const response = await apiRequest<undefined, { user: CurrentUser }>(
      "post",
      "/auth/me/avatar",
    );

    if (!response.ok || !response.data?.user) {
      toast.error(response.message ?? t("avatarUpdateFailed"));
      setIsUpdatingAvatar(false);
      return;
    }

    setAvatarUrl(response.data.user.avatarUrl);
    publishCurrentUserUpdate(response.data.user);
    toast.success(t("avatarUpdated"));
    setIsUpdatingAvatar(false);
    router.refresh();
  };

  return (
    <>
      <Card className="card card-border" id="profile">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRoundIcon aria-hidden="true" />
            {t("profileCardTitle")}
          </CardTitle>
          <CardDescription>{t("profileCardDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-6"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-muted/30 p-4">
              <Avatar size="xl">
                <AvatarImage src={avatarUrl ?? undefined} alt={user.fullName} />
                <AvatarFallback name={user.fullName} />
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="font-medium">{t("avatar")}</p>
                <p className="text-muted-foreground text-sm">
                  {t("avatarDescription")}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={updateAvatar}
                disabled={isUpdatingAvatar}
              >
                {isUpdatingAvatar ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <RefreshCwIcon data-icon="inline-start" />
                )}
                {isUpdatingAvatar ? t("updatingAvatar") : t("uploadAvatar")}
              </Button>
            </div>
            <FieldGroup>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <CommonFormField
                  control={form.control}
                  name="fullName"
                  label={t("fullName")}
                  required
                  inputProps={{ autoComplete: "name" }}
                />
                <CommonFormField
                  control={form.control}
                  name="email"
                  label={t("email")}
                  type="email"
                  required
                  inputProps={{ autoComplete: "email" }}
                  description={t("emailDescription")}
                />
                <CommonFormField
                  control={form.control}
                  name="phoneNumber"
                  label={t("phone")}
                  fieldType="phone"
                  placeholder="+250 788 123 456"
                  inputProps={{ autoComplete: "tel" }}
                  description={t("phoneDescription")}
                />
                <CommonFormField
                  control={form.control}
                  name="gender"
                  label={t("gender")}
                  fieldType="select"
                  selectOptions={genderOptions}
                />
              </div>
            </FieldGroup>

            {error ? (
              <Alert variant="destructive">
                <AlertCircleIcon aria-hidden="true" />
                <AlertTitle>{t("profileNotUpdated")}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            {success && !pendingEmail ? (
              <Alert>
                <CheckCircle2Icon aria-hidden="true" />
                <AlertTitle>{t("changesSaved")}</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isPending || !form.formState.isDirty}
              >
                {isPending ? <Spinner data-icon="inline-start" /> : null}
                {isPending ? t("saving") : t("saveProfile")}
              </Button>
            </div>
          </form>

          {pendingEmail ? (
            <>
              <Separator className="my-6" />
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="font-medium">
                    {t("verification.pendingTitle")}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {t("verification.pendingDesc", { email: pendingEmail })}
                  </p>
                </div>
                <Field data-invalid={Boolean(verificationError)}>
                  <FieldLabel htmlFor="profile-email-code">
                    {t("codeLabel")}
                  </FieldLabel>
                  <InputOTP
                    id="profile-email-code"
                    maxLength={6}
                    value={verificationCode}
                    onChange={setVerificationCode}
                    aria-invalid={Boolean(verificationError)}
                    disabled={isVerifying}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                  <FieldError>{verificationError}</FieldError>
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={verifyEmail}
                    disabled={isVerifying || verificationCode.length !== 6}
                  >
                    {isVerifying ? <Spinner data-icon="inline-start" /> : null}
                    {t("verification.verifyButton")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resendCode}
                    disabled={isResending}
                  >
                    {isResending ? <Spinner data-icon="inline-start" /> : null}
                    {t("verification.resendButton")}
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card className="card card-border" id="account">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailCheckIcon aria-hidden="true" />
            {t("account")}
          </CardTitle>
          <CardDescription>{t("accountDesc")}</CardDescription>
          <CardAction>
            <Badge variant={pendingEmail ? "secondary" : "outline"}>
              {pendingEmail
                ? t("verificationPending")
                : user.emailVerified
                  ? t("emailVerified")
                  : t("emailNotVerified")}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AccountDetail label={t("currentEmail")} value={user.email} />
          <AccountDetail
            label={t("memberSince")}
            value={formatMemberSince(user.createdAt, t)}
          />
        </CardContent>
      </Card>

      <Card className="card card-border" id="security">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRoundIcon aria-hidden="true" />
            {t("security")}
          </CardTitle>
          <CardDescription>{t("securityCardDesc")}</CardDescription>
          <CardAction>
            <Button asChild variant="outline" size="sm">
              <Link href="/me/security">{t("openSecurity")}</Link>
            </Button>
          </CardAction>
        </CardHeader>
      </Card>
    </>
  );
}

function AccountDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-box border bg-muted/40 p-4">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 break-words font-medium text-sm">{value}</p>
    </div>
  );
}

function isGenderValue(
  value: string | null,
): value is ProfileFormValues["gender"] {
  return value === "female" || value === "male" || value === "custom";
}

function formatMemberSince(value: string, t: Translator) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t("unavailable");

  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(date);
}

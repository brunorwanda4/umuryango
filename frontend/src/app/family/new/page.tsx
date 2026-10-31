import type { Metadata } from "next";
import { AppSidebarShell } from "@/components/app-shell/app-sidebar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getLocalizedHref,
  getMessages,
  type LocaleSearchParams,
  resolveLocaleFromSearchParams,
} from "@/i18n/config";
import { createTranslator } from "@/i18n/translate";
import enMessages from "@/messages/en.json";
import { CreateFamilyForm } from "../../../components/family/create-family-form";

export const metadata: Metadata = {
  title: enMessages.CreateFamilyPage.metadataTitle,
  description: enMessages.CreateFamilyPage.metadataDescription,
};

type CreateFamilyPageProps = {
  searchParams?: Promise<LocaleSearchParams>;
};

const CreateFamilyPage = async ({ searchParams }: CreateFamilyPageProps) => {
  const locale = resolveLocaleFromSearchParams(await searchParams);
  const messages = getMessages(locale);
  const createFamily = createTranslator(messages, "CreateFamilyPage");

  return (
    <AppSidebarShell mode="personal">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Badge variant="outline" className="w-fit">
            {createFamily((m) => m.CreateFamilyPage.badge)}
          </Badge>
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {createFamily((m) => m.CreateFamilyPage.heading)}
            </h2>
            <p className="max-w-2xl text-muted-foreground text-sm leading-relaxed">
              {createFamily((m) => m.CreateFamilyPage.description)}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {createFamily((m) => m.CreateFamilyPage.formTitle)}
            </CardTitle>
            <CardDescription>
              {createFamily((m) => m.CreateFamilyPage.formDescription)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateFamilyForm
              copy={messages.CreateFamilyForm}
              familyIndexHref={getLocalizedHref("/family", locale)}
            />
          </CardContent>
        </Card>
      </div>
    </AppSidebarShell>
  );
};

export default CreateFamilyPage;

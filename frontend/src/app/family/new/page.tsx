import type { Metadata } from "next";
import { AppSidebarShell } from "@/components/app-shell/app-sidebar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getLocalizedHref,
  getMessages,
  type LocaleSearchParams,
  resolveLocaleFromSearchParams,
} from "@/i18n/config";
import { createTranslator } from "@/i18n/translate";
import enMessages from "@/messages/en.json";
import { CreateFamilyForm } from "../../../components/family/create-family-form";
import { PageTitle } from "@/components/common/pages/page-title";

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
        <PageTitle
          title={createFamily((m) => m.CreateFamilyPage.formTitle)}
          description={createFamily((m) => m.CreateFamilyPage.formDescription)}
        />

        <Card>
          <CardHeader>
            <CardTitle>{createFamily((m) => m.CreateFamilyPage.formTitle)}</CardTitle>
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

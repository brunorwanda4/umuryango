import { AppSidebarShell } from "@/components/app-shell/app-sidebar";

const FamilyLayout = async (props: LayoutProps<"/family/[familyName]">) => {
  const { familyName } = await props.params;

  return (
    <AppSidebarShell familySlug={familyName} mode="family">
      {props.children}
    </AppSidebarShell>
  );
};

export default FamilyLayout;

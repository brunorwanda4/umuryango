import { AppSidebarShell } from "@/components/app-shell/app-sidebar";

const MeLayout = (props: LayoutProps<"/me">) => {
  return <AppSidebarShell mode="personal">{props.children}</AppSidebarShell>;
};

export default MeLayout;

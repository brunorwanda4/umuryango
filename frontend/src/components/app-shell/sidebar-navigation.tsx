"use client";

import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { LinkLoadingIndicator } from "./link-loading-indicator";
import { SidebarIcon } from "./sidebar-icon";
import { isActivePath, type NavigationGroup } from "./sidebar-utils";

export function SidebarNavigationGroups({
  groups,
  pathname,
  currentHash,
}: {
  groups: NavigationGroup[];
  pathname: string;
  currentHash: string;
}) {
  const { isMobile, state } = useSidebar();
  const showLinkLabels = isMobile || state === "expanded";

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => {
                const childIsActive = item.items?.some((sub) =>
                  isActivePath(pathname, sub.href, currentHash, sub.exact),
                );
                const itemIsActive =
                  childIsActive ||
                  isActivePath(pathname, item.href, currentHash, item.exact);

                return item.items?.length ? (
                  <Collapsible
                    key={item.href}
                    asChild
                    defaultOpen={itemIsActive}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          isActive={itemIsActive}
                          tooltip={item.title}
                        >
                          <SidebarIcon icon={item.icon} className="size-4" />
                          <span>{item.title}</span>
                          <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((sub) => (
                            <SidebarMenuSubItem key={sub.href}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isActivePath(
                                  pathname,
                                  sub.href,
                                  currentHash,
                                  sub.exact,
                                )}
                              >
                                <Link href={sub.href}>
                                  <LinkLoadingIndicator
                                    icon={sub.icon}
                                    title={sub.title}
                                    isOpen={showLinkLabels}
                                  />
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={itemIsActive}
                      tooltip={item.title}
                    >
                      <Link href={item.href}>
                        <LinkLoadingIndicator
                          icon={item.icon}
                          title={item.title}
                          isOpen={showLinkLabels}
                        />
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}

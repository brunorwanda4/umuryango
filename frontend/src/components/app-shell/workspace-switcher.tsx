"use client";

import {
  BanknoteArrowDownIcon,
  ChevronsUpDownIcon,
  ClipboardListIcon,
  LogOutIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import type { CurrentUser } from "@/hooks/use-current-user";
import apiRequest from "@/service/api";
import { type AppSidebarMode, workspaceLinks } from "./sidebar-utils";

type RecentFamily = {
  id: string;
  name: string;
  slug: string;
  role: string;
};

function useRecentFamilies() {
  const [families, setFamilies] = useState<RecentFamily[]>([]);

  useEffect(() => {
    let active = true;

    (async () => {
      const response = await apiRequest<undefined, RecentFamily[]>(
        "get",
        "/families?limit=3",
      );

      if (active && response.ok) {
        setFamilies(response.data ?? []);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return families;
}

export function WorkspaceSwitcher({
  currentFamilyName,
  currentFamilyHref,
  mode,
  user,
}: {
  currentFamilyName: string;
  currentFamilyHref?: string;
  mode: AppSidebarMode;
  user: CurrentUser | null;
}) {
  const router = useRouter();
  const recentFamilies = useRecentFamilies();
  const workspaceTitle =
    mode === "family" ? currentFamilyName : "Personal workspace";
  const title = user?.fullName ?? workspaceTitle;
  const description =
    user?.email ?? (mode === "family" ? "Family workspace" : "Your money");

  async function handleLogout() {
    await apiRequest("post", "/auth/logout");
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton size="lg" tooltip={title}>
          <Avatar size="sm">
            {user?.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt={title} />
            ) : null}
            <AvatarFallback name={title} />
          </Avatar>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate font-medium">{title}</span>
            <span className="truncate text-muted-foreground text-xs">
              {description}
            </span>
          </span>
          <ChevronsUpDownIcon aria-hidden="true" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="start">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        <DropdownMenuGroup>
          {currentFamilyHref ? (
            <DropdownMenuItem asChild>
              <Link href={currentFamilyHref}>
                <UsersIcon aria-hidden="true" />
                {currentFamilyName}
              </Link>
            </DropdownMenuItem>
          ) : null}
          {workspaceLinks.map((link) => (
            <DropdownMenuItem key={link.href} asChild>
              <Link href={link.href}>
                <link.icon aria-hidden="true" />
                {link.title}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        {recentFamilies.length ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Recent families</DropdownMenuLabel>
            <DropdownMenuGroup>
              {recentFamilies.map((family) => (
                <DropdownMenuItem key={family.id} asChild>
                  <Link href={`/family/${encodeURIComponent(family.slug)}`}>
                    <UsersIcon aria-hidden="true" />
                    {family.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/family">
              <ClipboardListIcon aria-hidden="true" />
              Manage family access
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/family/new">
              <BanknoteArrowDownIcon aria-hidden="true" />
              Create family
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
          <LogOutIcon aria-hidden="true" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

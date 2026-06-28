"use client";

import type { LucideIcon } from "lucide-react";
import {
	BadgeDollarSignIcon,
	BanknoteArrowDownIcon,
	BellIcon,
	BookOpenCheckIcon,
	CalendarDaysIcon,
	ChevronRightIcon,
	ChevronsUpDownIcon,
	ClipboardListIcon,
	FileTextIcon,
	FolderKanbanIcon,
	HandCoinsIcon,
	HomeIcon,
	LandmarkIcon,
	LayoutDashboardIcon,
	ListChecksIcon,
	LogOutIcon,
	ReceiptTextIcon,
	SettingsIcon,
	ShieldCheckIcon,
	TargetIcon,
	UsersIcon,
	WalletCardsIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useLayoutEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	SidebarProvider,
	SidebarRail,
	SidebarSeparator,
	SidebarTrigger,
	useSidebar,
} from "@/components/ui/sidebar";
import { type CurrentUser, useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import apiRequest from "@/service/api";

type NavigationItem = {
	title: string;
	href: string;
	icon: LucideIcon;
	items?: NavigationItem[];
};

const settingsChildren: NavigationItem[] = [
	{ title: "Security", href: "/me/security", icon: ShieldCheckIcon },
	{ title: "Help and guides", href: "/items", icon: BookOpenCheckIcon },
];

type NavigationGroup = {
	label: string;
	items: NavigationItem[];
};

type AppSidebarMode = "family" | "personal";

type AppSidebarShellProps = {
	children: ReactNode;
	mode: AppSidebarMode;
	familySlug?: string;
};

const personalNavigation: NavigationGroup[] = [
	{
		label: "Personal",
		items: [
			{ title: "Overview", href: "/me", icon: LayoutDashboardIcon },
			{ title: "My money", href: "/me/money", icon: WalletCardsIcon },
			{ title: "Plans", href: "/me/plans", icon: ListChecksIcon },
			{ title: "Savings goals", href: "/me/savings", icon: TargetIcon },
			{ title: "Debts", href: "/me/debts", icon: LandmarkIcon },
		],
	},
	{
		label: "Workspace",
		items: [
			{ title: "Documents", href: "/me/documents", icon: FileTextIcon },
			{ title: "Family workspaces", href: "/family", icon: UsersIcon },
			{
				title: "Settings",
				href: "/me/settings",
				icon: SettingsIcon,
				items: settingsChildren,
			},
		],
	},
];

const getFamilyNavigation = (familySlug: string): NavigationGroup[] => {
	const familyHref = `/family/${familySlug}`;

	return [
		{
			label: "Family",
			items: [
				{ title: "Dashboard", href: familyHref, icon: HomeIcon },
				{
					title: "Money",
					href: `${familyHref}/money`,
					icon: BadgeDollarSignIcon,
				},
				{
					title: "Contributions",
					href: `${familyHref}/contributions`,
					icon: HandCoinsIcon,
				},
				{
					title: "Projects",
					href: `${familyHref}/projects`,
					icon: FolderKanbanIcon,
				},
				{
					title: "Reports",
					href: `${familyHref}/reports`,
					icon: ReceiptTextIcon,
				},
			],
		},
		{
			label: "Operations",
			items: [
				{
					title: "Events",
					href: `${familyHref}/events`,
					icon: CalendarDaysIcon,
				},
				{
					title: "Announcements",
					href: `${familyHref}/announcements`,
					icon: BellIcon,
				},
				{
					title: "Documents",
					href: `${familyHref}/documents`,
					icon: FileTextIcon,
				},
				{ title: "Members", href: `${familyHref}/members`, icon: UsersIcon },
				{
					title: "Settings",
					href: `${familyHref}/settings`,
					icon: SettingsIcon,
					items: settingsChildren,
				},
			],
		},
	];
};

const workspaceLinks = [
	{ title: "Personal workspace", href: "/me", icon: WalletCardsIcon },
	{ title: "All families", href: "/family", icon: UsersIcon },
];

const RESIZE_STORAGE_KEY = "sidebar-width";
const SIDEBAR_MIN_WIDTH = 180;
const SIDEBAR_MAX_WIDTH = 420;
const SIDEBAR_DEFAULT_WIDTH = 256;

function SidebarResizeHandle({ open }: { open: boolean }) {
	const { toggleSidebar, state } = useSidebar();

	useLayoutEffect(() => {
		const stored = localStorage.getItem(RESIZE_STORAGE_KEY);
		if (!stored) return;
		const wrapper = document.querySelector(
			'[data-slot="sidebar-wrapper"]',
		) as HTMLElement | null;
		if (wrapper) wrapper.style.setProperty("--sidebar-width", stored);
	}, []);

	function handleMouseDown(e: React.MouseEvent<HTMLButtonElement>) {
		if (state === "collapsed") {
			toggleSidebar();
			return;
		}
		e.preventDefault();

		const wrapper = document.querySelector(
			'[data-slot="sidebar-wrapper"]',
		) as HTMLElement | null;
		if (!wrapper) return;
		const sidebarWrapper = wrapper;

		const gap = sidebarWrapper.querySelector(
			'[data-slot="sidebar-gap"]',
		) as HTMLElement | null;
		const startWidth = gap
			? gap.getBoundingClientRect().width
			: SIDEBAR_DEFAULT_WIDTH;
		const startX = e.clientX;
		let didMove = false;

		document.body.style.cursor = "col-resize";
		document.body.style.userSelect = "none";

		function onMove(me: MouseEvent) {
			const delta = me.clientX - startX;
			if (Math.abs(delta) > 3) didMove = true;
			const newW = Math.min(
				SIDEBAR_MAX_WIDTH,
				Math.max(SIDEBAR_MIN_WIDTH, startWidth + delta),
			);
			sidebarWrapper.style.setProperty("--sidebar-width", `${newW}px`);
		}

		function onUp() {
			document.body.style.cursor = "";
			document.body.style.userSelect = "";
			if (!didMove) {
				toggleSidebar();
			} else {
				const w = sidebarWrapper.style.getPropertyValue("--sidebar-width");
				if (w) localStorage.setItem(RESIZE_STORAGE_KEY, w);
			}
			document.removeEventListener("mousemove", onMove);
			document.removeEventListener("mouseup", onUp);
		}

		document.addEventListener("mousemove", onMove);
		document.addEventListener("mouseup", onUp);
	}

	return (
		<button
			type="button"
			data-sidebar="rail"
			data-slot="sidebar-rail"
			aria-label="Resize Sidebar"
			tabIndex={-1}
			onMouseDown={handleMouseDown}
			title={state === "collapsed" ? "Expand Sidebar" : "Resize Sidebar"}
			className={cn(
				"absolute inset-y-0 z-20 hidden w-4 transition-colors ease-linear sm:flex",
				"group-data-[side=left]:-right-4 group-data-[side=right]:left-0",
				open
					? "after:absolute after:inset-y-0 after:start-1/2 after:w-[1px] after:bg-sidebar-border"
					: null,
				"group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full hover:group-data-[collapsible=offcanvas]:bg-sidebar",
				"[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
				"[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
				state === "collapsed" ? "cursor-e-resize" : "cursor-col-resize",
			)}
		/>
	);
}

export function AppSidebarShell(props: AppSidebarShellProps) {
	return (
		<SidebarProvider>
			<AppSidebarContent {...props} />
		</SidebarProvider>
	);
}

function AppSidebarContent({
	children,
	mode,
	familySlug,
}: AppSidebarShellProps) {
	const pathname = usePathname();
	const encodedFamilySlug = encodeURIComponent(familySlug ?? "");
	const { isMobile, setOpenMobile, open } = useSidebar();
	const { user } = useCurrentUser();
	const familyName = formatFamilyName(familySlug);
	const navigation =
		mode === "family" && encodedFamilySlug
			? getFamilyNavigation(encodedFamilySlug)
			: personalNavigation;
	const activeItem = getActiveNavigationItem(pathname, navigation);
	const title =
		activeItem?.title ??
		(mode === "family" ? familyName : "Personal workspace");
	const contextLabel =
		mode === "family" ? "Family workspace" : "Personal workspace";

	return (
		<>
			<Sidebar
				collapsible="icon"
				className={cn(
					"[&_[data-slot=sidebar-inner]]:bg-background",
					open &&
						"md:!border-r-0 md:!bg-transparent md:[&>[data-slot=sidebar-inner]]:!bg-transparent",
				)}
			>
				<SidebarHeader>
					<div className="flex items-center justify-between gap-2 px-1">
						<span className="truncate bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text font-bold text-base text-transparent tracking-tight group-data-[collapsible=icon]:hidden">
							{mode === "family" ? familyName : "Personal workspace"}
						</span>
						<SidebarTrigger />
					</div>
				</SidebarHeader>
				<SidebarContent>
					{navigation.map((group) => (
						<SidebarGroup key={group.label}>
							<SidebarGroupLabel>{group.label}</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									{group.items.map((item) =>
										item.items?.length ? (
											<Collapsible
												key={item.href}
												asChild
												defaultOpen={isActivePath(pathname, item.href)}
												className="group/collapsible"
											>
												<SidebarMenuItem>
													<CollapsibleTrigger asChild>
														<SidebarMenuButton
															isActive={isActivePath(pathname, item.href)}
															tooltip={item.title}
														>
															<item.icon aria-hidden="true" />
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
																		isActive={isActivePath(pathname, sub.href)}
																	>
																		<Link href={sub.href}>
																			<sub.icon aria-hidden="true" />
																			<span>{sub.title}</span>
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
													isActive={isActivePath(pathname, item.href)}
													tooltip={item.title}
												>
													<Link href={item.href}>
														<item.icon aria-hidden="true" />
														<span>{item.title}</span>
													</Link>
												</SidebarMenuButton>
											</SidebarMenuItem>
										),
									)}
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					))}
				</SidebarContent>
				<SidebarSeparator />
				<SidebarFooter>
					<SidebarMenu>
						<SidebarMenuItem>
							<WorkspaceSwitcher
								currentFamilyName={familyName}
								currentFamilyHref={
									encodedFamilySlug ? `/family/${encodedFamilySlug}` : undefined
								}
								mode={mode}
								user={user}
							/>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarFooter>
				<SidebarRail />
				<SidebarResizeHandle open={open} />
			</Sidebar>
			<SidebarInset>
				<main className="min-h-[calc(100svh-3.5rem)] p-4 sm:p-6">
					{children}
				</main>
			</SidebarInset>
		</>
	);
}

function WorkspaceSwitcher({
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
						<AvatarFallback>{getInitials(title)}</AvatarFallback>
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

function getActiveNavigationItem(
	pathname: string,
	navigation: NavigationGroup[],
) {
	return navigation
		.flatMap((group) => group.items)
		.find((item) => isActivePath(pathname, item.href));
}

function isActivePath(pathname: string, href: string) {
	if (href === "/me" || /^\/family\/[^/]+$/.test(href)) {
		return pathname === href;
	}

	return pathname === href || pathname.startsWith(`${href}/`);
}

function formatFamilyName(familySlug?: string) {
	if (!familySlug) {
		return "Family workspace";
	}

	return decodeURIComponent(familySlug)
		.replace(/[-_]+/g, " ")
		.replace(/\s+/g, " ")
		.trim()
		.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getInitials(value: string) {
	return value
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join("");
}

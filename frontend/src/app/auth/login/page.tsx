import {
	ArrowUpRightIcon,
	PiggyBankIcon,
	TrendingUpIcon,
	UsersIcon,
	WalletIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LoginForm } from "./login-form";

const loginCopy = {
	title: "Log into Rwanda Family",
	heading: "Organize the family moments you protect.",
	highlightedHeading: "together.",
	createAccount: "Create new account",
	footer: "Rwanda Family",
};

export const metadata: Metadata = {
	title: "Log in",
	description:
		"Log in to Rwanda Family to manage family money, contributions, projects, documents, announcements, and reports.",
};

const LoginPage = () => {
	return (
		<main className="grid min-h-dvh bg-background text-foreground lg:grid-cols-[minmax(0,1fr)_minmax(28rem,1fr)]">
			<section className="relative flex min-h-[42rem] flex-col overflow-hidden border-border px-6 py-8 sm:px-10 lg:min-h-dvh lg:border-r lg:px-12">
				<Link
					href="/"
					className="flex size-14 items-center justify-center rounded-2xl bg-card shadow-sm ring-1 ring-border"
					aria-label="Rwanda Family home"
				>
					<Image
						src="/logo.svg"
						alt=""
						width={56}
						height={56}
						priority
						className="rounded-2xl"
					/>
				</Link>

				<div className="flex flex-1 items-center py-10">
					<div className="grid w-full items-center gap-10 md:grid-cols-[minmax(13rem,0.62fr)_minmax(22rem,1fr)] lg:grid-cols-[minmax(13rem,0.6fr)_minmax(22rem,1fr)] xl:gap-14">
						<h1 className="max-w-sm text-5xl font-semibold leading-[1.04] tracking-normal text-balance sm:text-6xl md:text-5xl xl:text-6xl">
							{loginCopy.heading}{" "}
							<span className="text-muted-foreground">
								{loginCopy.highlightedHeading}
							</span>
						</h1>

						<div className="relative mx-auto aspect-[0.98] w-full max-w-[32rem] xl:max-w-[36rem] 2xl:max-w-[40rem]">
							<Card className="absolute right-[4%] top-[10%] z-20 aspect-[0.74] w-[56%] overflow-hidden rounded-[1.6rem] p-0 shadow-md ring-1 ring-border">
								<Image
									src="/images/auth/1.jpg"
									alt="Family enjoying time together"
									fill
									priority
									sizes="(min-width: 1280px) 20rem, (min-width: 768px) 32vw, 58vw"
									className="object-cover"
								/>
								<div className="absolute inset-x-4 top-4 flex flex-col gap-1.5">
									<div className="flex items-center justify-between text-[0.65rem] font-semibold text-background">
										<span className="opacity-80">Family savings</span>
										<span>62%</span>
									</div>
									<div className="h-1.5 rounded-full bg-background/40">
										<div className="h-full w-[62%] rounded-full bg-primary" />
									</div>
								</div>
								<Badge className="absolute bottom-3 left-3 gap-1 rounded-full bg-background font-semibold text-foreground">
									<WalletIcon aria-hidden="true" className="size-3" />
									RWF 1.2M
								</Badge>
							</Card>

							<Card className="absolute left-[4%] top-[25%] z-10 aspect-[1.12] w-[42%] overflow-hidden rounded-[1.45rem] p-0 shadow-md ring-1 ring-border">
								<Image
									src="/images/auth/2.jpg"
									alt="Family capturing a shared moment"
									fill
									sizes="(min-width: 1280px) 15rem, (min-width: 768px) 24vw, 42vw"
									className="object-cover"
								/>
								<div className="absolute left-3 top-3 flex size-9 items-center justify-center rounded-xl bg-background/90 text-foreground shadow-sm">
									<UsersIcon aria-hidden="true" className="size-5" />
								</div>
							</Card>

							<Card className="absolute bottom-[12%] left-[18%] z-30 w-[42%] gap-3 rounded-[1.35rem] p-3 shadow-md ring-1 ring-border">
								<div className="relative aspect-[1.28] overflow-hidden rounded-xl">
									<Image
										src="/images/auth/3.jpg"
										alt="Family planning together at home"
										fill
										sizes="(min-width: 1280px) 15rem, (min-width: 768px) 24vw, 42vw"
										className="object-cover object-center"
									/>
								</div>
								<div className="flex items-center gap-2.5">
									<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
										<ArrowUpRightIcon aria-hidden="true" className="size-4" />
									</div>
									<div className="flex min-w-0 flex-col">
										<span className="truncate text-xs font-semibold">
											Monthly contribution
										</span>
										<span className="text-[0.7rem] font-semibold text-muted-foreground">
											+ RWF 50,000
										</span>
									</div>
								</div>
							</Card>

							<div className="absolute bottom-[14%] left-[38%] z-40 size-28 overflow-hidden rounded-full border-4 border-background bg-muted shadow-2xl ring-2 ring-primary sm:size-32">
								<Image
									src="/images/auth/4.jpg"
									alt="Family using Rwanda Family together"
									fill
									sizes="8rem"
									className="object-cover object-center"
								/>
							</div>

							<div className="absolute left-[8%] top-[17%] z-40 flex size-12 rotate-[-10deg] items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
								<TrendingUpIcon aria-hidden="true" className="size-6" />
							</div>
							<div className="absolute right-[10%] top-[50%] z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl">
								<PiggyBankIcon aria-hidden="true" className="size-7" />
							</div>
							<Badge className="absolute bottom-[25%] right-[18%] z-30 gap-1 rounded-full bg-background font-semibold text-foreground shadow-sm">
								<WalletIcon aria-hidden="true" className="size-3" />
								Expenses
							</Badge>
						</div>
					</div>
				</div>
			</section>

			<section className="flex items-start border-t border-border px-6 py-10 sm:px-10 lg:min-h-dvh lg:items-center lg:border-t-0 lg:px-14">
				<div className="mx-auto flex w-full max-w-[32.75rem] flex-col gap-8">
					<div className="flex flex-col gap-2">
						<h2 className="text-xl font-semibold tracking-normal">
							{loginCopy.title}
						</h2>
					</div>

					<LoginForm />

					<Button
						href="/auth/register"
						variant="outline"
						className="h-12 w-full rounded-full border-primary/30 text-sm font-semibold text-primary hover:text-primary"
					>
						{loginCopy.createAccount}
					</Button>

					<Separator className="my-3" />

					<div className="flex flex-col items-center gap-5">
						<div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
							<Image src="/logo.svg" alt="" width={24} height={24} />
							<span>{loginCopy.footer}</span>
						</div>
					</div>
				</div>
			</section>
		</main>
	);
};

export default LoginPage;

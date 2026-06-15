import { HeartIcon, HomeIcon, SmileIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LoginForm } from "./login-form";

const loginCopy = {
	title: "Log into Rwanda Family",
	heading: "Organize the family moments you protect.",
	highlightedHeading: "together.",
	footer: "Rwanda Family",
};

export const metadata: Metadata = {
	title: "Log in",
	description:
		"Log in to Rwanda Family to manage family money, contributions, projects, documents, announcements, and reports.",
};

const LoginPage = () => {
	return (
		<main className="dark grid min-h-dvh bg-background text-foreground lg:grid-cols-[minmax(0,1fr)_minmax(28rem,1fr)]">
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
					<div className="grid w-full items-center gap-10 md:grid-cols-[minmax(15rem,0.76fr)_minmax(20rem,1fr)] lg:grid-cols-[minmax(14rem,0.78fr)_minmax(18rem,1fr)] xl:gap-12">
						<h1 className="max-w-sm text-5xl font-semibold leading-[1.04] tracking-normal text-balance sm:text-6xl md:text-5xl xl:text-6xl">
							{loginCopy.heading}{" "}
							<span className="text-muted-foreground">
								{loginCopy.highlightedHeading}
							</span>
						</h1>

						<div className="relative mx-auto aspect-[0.98] w-full max-w-[26rem] 2xl:max-w-[28rem]">
							<Card className="absolute right-[4%] top-[10%] z-20 aspect-[0.74] w-[56%] overflow-hidden rounded-[1.6rem] p-0 shadow-2xl ring-border">
								<Image
									src="/images/auth/1.jpg"
									alt="Family enjoying time together"
									fill
									priority
									sizes="(min-width: 1280px) 15rem, (min-width: 768px) 30vw, 58vw"
									className="object-cover"
								/>
								<div className="absolute left-4 right-4 top-4 h-1 rounded-full bg-background/75">
									<div className="h-full w-[38%] rounded-full bg-primary" />
								</div>
								<Badge className="absolute right-3 top-8 rounded-full bg-background text-foreground">
									16:45
								</Badge>
							</Card>

							<Card className="absolute left-[4%] top-[25%] z-10 aspect-[1.12] w-[42%] overflow-hidden rounded-[1.45rem] p-0 shadow-xl ring-border">
								<Image
									src="/images/auth/2.jpg"
									alt="Family capturing a shared moment"
									fill
									sizes="(min-width: 1280px) 11rem, (min-width: 768px) 24vw, 42vw"
									className="object-cover"
								/>
								<div className="absolute left-3 top-3 flex size-9 items-center justify-center rounded-xl bg-background/90 text-foreground shadow-sm">
									<HomeIcon aria-hidden="true" className="size-5" />
								</div>
							</Card>

							<Card className="absolute bottom-[12%] left-[18%] z-30 w-[42%] gap-3 rounded-[1.35rem] p-3 shadow-2xl ring-border">
								<div className="relative aspect-[1.28] overflow-hidden rounded-xl">
									<Image
										src="/images/auth/3.jpg"
										alt="Family planning together at home"
										fill
										sizes="(min-width: 1280px) 11rem, (min-width: 768px) 24vw, 42vw"
										className="object-cover object-center"
									/>
								</div>
								<div className="flex flex-col gap-2">
									<div className="h-2 rounded-full bg-muted" />
									<div className="h-2 w-3/5 rounded-full bg-muted" />
								</div>
							</Card>

							<div className="absolute bottom-[14%] left-[39%] z-40 size-24 overflow-hidden rounded-full border-4 border-background bg-muted shadow-2xl ring-2 ring-primary sm:size-28">
								<Image
									src="/images/auth/4.jpg"
									alt="Family using Rwanda Family together"
									fill
									sizes="7rem"
									className="object-cover object-center"
								/>
							</div>

							<div className="absolute left-[8%] top-[17%] z-40 flex size-12 rotate-[-10deg] items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
								<SmileIcon aria-hidden="true" className="size-6" />
							</div>
							<div className="absolute right-[10%] top-[50%] z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl">
								<HeartIcon aria-hidden="true" className="size-7 fill-current" />
							</div>
							<div className="absolute bottom-[25%] right-[22%] z-30 flex gap-2">
								<span className="size-4 rounded-full border border-background bg-background shadow-sm" />
								<span className="size-4 rounded-full border border-background bg-background shadow-sm" />
								<span className="size-4 rounded-full border border-background bg-background shadow-sm" />
							</div>
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

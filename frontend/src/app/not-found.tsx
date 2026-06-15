import { CompassIcon, HouseIcon, LogInIcon } from "lucide-react";
import type { Metadata } from "next";
import { PublicSiteShell } from "@/components/public-site-shell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
	title: "Page not found",
	description: "The page you are looking for does not exist or has moved.",
};

export default function NotFound() {
	return (
		<PublicSiteShell>
			<main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-8 px-5 py-20 text-center sm:px-6">
				<div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
					<CompassIcon aria-hidden="true" className="size-8 text-muted-foreground" />
				</div>

				<div className="flex flex-col gap-3">
					<p className="text-sm font-semibold tracking-wide text-muted-foreground">
						404
					</p>
					<h1 className="text-4xl font-semibold tracking-normal text-balance sm:text-5xl">
						This page does not exist
					</h1>
					<p className="mx-auto max-w-md text-lg leading-8 text-muted-foreground">
						The page you are looking for may have been moved, renamed, or is no
						longer available.
					</p>
				</div>

				<div className="flex flex-col gap-3 sm:flex-row">
					<Button
						href="/"
						size="lg"
						className="h-12 w-full rounded-full sm:w-fit"
					>
						<HouseIcon data-icon="inline-start" aria-hidden="true" />
						Back to home
					</Button>
					<Button
						href="/auth/login"
						variant="outline"
						size="lg"
						className="h-12 w-full rounded-full sm:w-fit"
					>
						<LogInIcon data-icon="inline-start" aria-hidden="true" />
						Log in
					</Button>
				</div>
			</main>
		</PublicSiteShell>
	);
}

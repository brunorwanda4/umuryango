import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Home() {
	return (
		<div className="flex flex-1 flex-col items-center justify-center bg-background font-sans text-foreground">
			<main className="flex w-full max-w-3xl flex-1 flex-col items-center justify-between bg-card px-16 py-32 sm:items-start">
				<Image
					className="rounded-2xl"
					src="/logo.svg"
					alt="Rwanda Family logo"
					width={44}
					height={44}
					priority
				/>
				<div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
					<h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-normal text-balance">
						Rwanda Family
					</h1>
					<p className="max-w-md text-lg leading-8 text-muted-foreground">
						Securely manage family money, contributions, projects, documents,
						announcements, events, and reports.
					</p>
				</div>
				<div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
					<Button
						size="lg"
						className="h-12 w-full rounded-full md:w-[158px]"
						href="/auth/login"
					>
						Log in
					</Button>
					<Button
						variant="outline"
						size="lg"
						className="h-12 w-full rounded-full md:w-[158px]"
						href="/auth/register"
					>
						Create account
					</Button>
				</div>
			</main>
		</div>
	);
}

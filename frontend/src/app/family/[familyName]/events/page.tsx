import { FamilyEventsCalendar } from "@/components/family/family-events-calendar";

export default async function FamilyEventsPage(
	props: PageProps<"/family/[familyName]/events">,
) {
	const { familyName } = await props.params;
	const displayName = decodeURIComponent(familyName).replaceAll("-", " ");

	return (
		<main className="flex min-h-svh flex-col gap-6 p-4 sm:p-6">
			<header className="flex flex-col gap-2">
				<div className="flex flex-col gap-1">
					<h1 className="font-semibold text-2xl tracking-normal sm:text-3xl">
						Events
					</h1>
					<p className="max-w-2xl text-muted-foreground text-sm">
						Plan family meetings, ceremonies, contribution deadlines, and
						reminders.
					</p>
				</div>
			</header>
			<FamilyEventsCalendar />
		</main>
	);
}

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Toaster } from "@/components/ui/sonner";
import { TripCreationOverlay } from "@/components/trip/TripCreationOverlay";
import { TripNavOverlay } from "@/components/trip/TripNavOverlay";
import { NotificationBell } from "@/components/notification/NotificationBell";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { StarField } from "@/components/ui/StarField";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t0 = performance.now();
  const session = await auth();
  if (!session) redirect("/login");
  console.log(`[layout] auth: ${(performance.now() - t0).toFixed(0)}ms`);

  const t1 = performance.now();
  const [user] = await db
    .select({ name: users.name, image: users.image })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  console.log(`[layout] user query: ${(performance.now() - t1).toFixed(0)}ms`);
  console.log(`[layout] total: ${(performance.now() - t0).toFixed(0)}ms`);

  const initials = (user?.name ?? session.user.email ?? "?").charAt(0).toUpperCase();

  return (
    <div className="h-[100dvh] flex flex-col bg-gradient-to-b from-sky-100/60 to-white dark:from-[oklch(0.16_0.015_228)] dark:to-[oklch(0.145_0.01_228)]">
      <StarField />
      <header className="shrink-0 z-50 border-b border-sky-200/70 dark:border-sky-900/50 bg-white/95 dark:bg-[oklch(0.19_0.015_228)]/95 backdrop-blur-sm shadow-[0_1px_0_0_oklch(0.85_0.04_228/0.4)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:py-3 py-1">
          <Link href="/dashboard" className="flex items-center gap-1.5">
            <img src="/tabipla_icon_4.png" alt="" className="h-9 w-auto" />
            {/* <img src="/tabipla_text_2.png" alt="" className="h-7 w-auto dark:hidden" />
            <img src="/tabipla_text_2_dark.png" alt="" className="h-7 w-auto hidden dark:block" /> */}
            <img src="/tabipla_logo.svg" alt="" className="h-6 w-auto mt-[3px] mb-0 dark:hidden" />
            <img src="/tabipla_logo_dark.svg" alt="" className="h-6 w-auto mt-[3px] mb-0 hidden dark:block" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-1">
            <NotificationBell />
            <Link href="/account" className="flex items-center gap-2 p-1.5 rounded-full hover:opacity-80 transition-opacity">
              <Avatar size="sm">
                {user?.image && <AvatarImage src={user.image} alt={user?.name ?? ""} />}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-600 dark:text-gray-200 hidden sm:block">{user?.name ?? "アカウント"}</span>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-none">
        <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
      </main>
      <Toaster />
      <TripCreationOverlay />
      <TripNavOverlay />
    </div>
  );
}

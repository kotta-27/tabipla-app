import { auth } from "@/auth";
import { db } from "@/lib/db";
import { tripInvites } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const [invite] = await db
    .select({ tripId: tripInvites.tripId })
    .from(tripInvites)
    .where(eq(tripInvites.token, token))
    .limit(1);

  if (!invite) {
    redirect("/dashboard?error=" + encodeURIComponent("無効な招待リンクです"));
  }

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/join/${token}`);
  }

  redirect(`/dashboard?joinToken=${token}`);
}

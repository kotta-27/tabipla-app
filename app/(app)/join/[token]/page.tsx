import { joinTripByToken } from "@/actions/trips";
import { redirect } from "next/navigation";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await joinTripByToken(token);

  if ("error" in result) {
    redirect(`/dashboard?error=${encodeURIComponent(result.error)}`);
  }

  redirect("/dashboard");
}

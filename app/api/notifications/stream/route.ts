import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notifications } from "@/lib/schema";
import { and, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const userId = session.user.id;
  const encoder = new TextEncoder();

  let lastCount = -1;
  let lastLatest = "";
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(": connected\n\n"));

      intervalId = setInterval(async () => {
        if (closed) return;
        try {
          const [row] = await db
            .select({
              count: sql<number>`count(*) filter (where read = false)::int`,
              latest: sql<string>`coalesce(max(created_at)::text, '')`,
            })
            .from(notifications)
            .where(eq(notifications.userId, userId));

          const count = row.count;
          const latest = row.latest;
          if (lastCount !== -1 && (count > lastCount || latest !== lastLatest)) {
            controller.enqueue(encoder.encode("data: new\n\n"));
          }
          lastCount = count;
          lastLatest = latest;
        } catch {
          // DB error - ignore, will retry
        }
      }, 4000);
    },
    cancel() {
      closed = true;
      if (intervalId) clearInterval(intervalId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

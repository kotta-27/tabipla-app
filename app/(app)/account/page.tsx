import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { AccountForm } from "@/components/account/AccountForm";
import { BackButton } from "@/components/ui/BackButton";

export default async function AccountPage() {
  const authUser = await requireAuth();
  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email, image: users.image })
    .from(users)
    .where(eq(users.id, authUser.id))
    .limit(1);

  return (
    <div className="max-w-lg mx-auto space-y-2">
      <div className="relative flex items-center mb-6">
        <h1 className="text-xl font-bold">アカウント設定</h1>
        <BackButton className="absolute right-0" />
      </div>
      <AccountForm user={user} />
    </div>
  );
}

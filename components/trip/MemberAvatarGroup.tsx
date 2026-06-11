"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import { Avatar, AvatarImage, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";

interface Member {
  name: string | null;
  image: string | null;
  role: string;
}

export function MemberAvatarGroup({ members }: { members: Member[] }) {
  const sorted = [...members].sort((a, b) => (a.role === "owner" ? -1 : b.role === "owner" ? 1 : 0));
  const visible = sorted.slice(0, 5);

  return (
    <Tooltip.Provider delay={400}>
      <AvatarGroup className="ml-4">
        {visible.map((m, i) => (
          <Tooltip.Root key={i}>
            <Tooltip.Trigger render={
              <Avatar
                size="sm"
                className={`sm:!size-8 cursor-default ${m.role === "owner" ? "!ring-sky-400" : ""}`}
              >
                {m.image && <AvatarImage src={m.image} alt={m.name ?? ""} />}
                <AvatarFallback>{(m.name ?? "?").charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            } />
            <Tooltip.Portal>
              <Tooltip.Positioner side="bottom" sideOffset={6}>
                <Tooltip.Popup className="z-50 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 shadow-lg">
                  {m.name ?? "不明"}
                  {m.role === "owner" && <span className="ml-1.5 text-sky-500">オーナー</span>}
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        ))}
        {members.length > 5 && <AvatarGroupCount className="sm:!size-8">+{members.length - 5}</AvatarGroupCount>}
      </AvatarGroup>
    </Tooltip.Provider>
  );
}

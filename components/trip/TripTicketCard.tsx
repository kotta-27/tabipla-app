import { MapPin } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";

const VARIANTS = [
  { gradient: "from-sky-400 via-sky-500 to-blue-600" },
  { gradient: "from-amber-400 via-orange-400 to-rose-500" },
  { gradient: "from-teal-400 via-cyan-500 to-sky-600" },
  { gradient: "from-rose-400 via-pink-500 to-fuchsia-600" },
  { gradient: "from-indigo-400 via-violet-500 to-purple-600" },
];

export function getVariant(id: string) {
  return VARIANTS[(id.codePointAt(0) ?? 0) % VARIANTS.length];
}
export function getFlightCode(id: string): string {
  const n = (((id.codePointAt(0) ?? 0) * 7 + (id.codePointAt(1) ?? 0)) % 900) + 100;
  return `TP-${n}`;
}

const NOTCH_Y = 96;

const TICKET_MASK: React.CSSProperties = {
  WebkitMaskImage: `radial-gradient(circle 9px at 0 ${NOTCH_Y}px, transparent 8.5px, #000 9.5px), radial-gradient(circle 9px at 100% ${NOTCH_Y}px, transparent 8.5px, #000 9.5px)`,
  maskImage: `radial-gradient(circle 9px at 0 ${NOTCH_Y}px, transparent 8.5px, #000 9.5px), radial-gradient(circle 9px at 100% ${NOTCH_Y}px, transparent 8.5px, #000 9.5px)`,
  WebkitMaskComposite: "source-in",
  maskComposite: "intersect",
};

const BARCODE: React.CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(90deg, currentColor 0 1.5px, transparent 1.5px 3.5px), repeating-linear-gradient(90deg, currentColor 0 1px, transparent 1px 6.5px)",
};

export interface TripTicketMember {
  userId: string;
  name: string | null;
  image: string | null;
  role: string;
}

interface TripTicketCardProps {
  tripId: string;
  tripName: string;
  tripEmoji: string;
  tripDestination?: string | null;
  members?: TripTicketMember[];
  startDate?: string | null;
  role?: string;
  className?: string;
}

export function TripTicketCard({
  tripId,
  tripName,
  tripEmoji,
  tripDestination,
  members = [],
  startDate,
  role,
  className,
}: TripTicketCardProps) {
  const variant = getVariant(tripId);

  return (
    <div
      className={`w-[170px] overflow-hidden rounded-xl bg-white shadow-[0_10px_24px_-8px_rgba(2,60,110,0.35),0_2px_6px_rgba(2,60,110,0.12)] ${className ?? ""}`}
      style={TICKET_MASK}
    >
      {/* Header */}
      <div
        className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${variant.gradient}`}
        style={{ height: NOTCH_Y }}
      >
        <div className="absolute -top-3 -right-3 h-16 w-16 rounded-full bg-white/10" />
        <div className="absolute -bottom-2 -left-2 h-12 w-12 rounded-full bg-white/10" />
        <div className="absolute top-2 left-2.5 right-2.5 flex items-center justify-between font-mono text-[7.5px] font-semibold tracking-[0.22em] text-white/75">
          <span>TABIPLA&nbsp;PASS</span>
          <span>{getFlightCode(tripId)}</span>
        </div>
        <span className="z-10 select-none text-[46px] leading-none drop-shadow-md">{tripEmoji}</span>
        {role === "owner" && (
          <span className="absolute bottom-1.5 right-2 rotate-[6deg] rounded-[3px] border border-white/70 px-1 py-px font-mono text-[7px] font-bold tracking-[0.18em] text-white/90">
            OWNER
          </span>
        )}
      </div>

      {/* Perforation */}
      <div className="border-t-2 border-dashed border-slate-300" />

      {/* Stub */}
      <div className="space-y-1.5 px-3 pb-2.5 pt-2">
        <p
          className="text-[13px] font-bold leading-snug text-slate-900"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {tripName}
        </p>
        {tripDestination && (
          <p className="flex items-center gap-0.5 text-[11px] text-slate-400">
            <MapPin size={9} className="shrink-0" />
            <span className="truncate">{tripDestination}</span>
          </p>
        )}
        <div className="flex items-center justify-between pt-0.5">
          {members.length > 0 ? (
            <AvatarGroup>
              {members.slice(0, 3).map((m) => (
                <Avatar key={m.userId} size="sm" className={m.role === "owner" ? "!ring-sky-400" : ""}>
                  {m.image && <AvatarImage src={m.image} alt={m.name ?? ""} />}
                  <AvatarFallback>{(m.name ?? "?").charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              ))}
              {members.length > 3 && <AvatarGroupCount>+{members.length - 3}</AvatarGroupCount>}
            </AvatarGroup>
          ) : (
            <div />
          )}
          <p className="font-mono text-[10px] font-semibold tabular-nums text-slate-500">
            {startDate
              ? new Date(startDate + "T00:00:00").toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" }) + "〜"
              : "日程未定"}
          </p>
        </div>
        <div className="h-3 text-slate-800 opacity-70" style={BARCODE} />
      </div>
    </div>
  );
}

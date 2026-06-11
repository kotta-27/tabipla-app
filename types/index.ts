export type TripRole = "owner" | "member";
export type PollResponse = "ok" | "maybe" | "ng";

export interface Trip {
  id: string;
  name: string;
  destination: string | null;
  cover_emoji: string;
  created_by: string;
  created_at: string;
}

export interface TripMember {
  id: string;
  trip_id: string;
  user_id: string;
  role: TripRole;
  joined_at: string;
  profiles?: Profile;
}

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface SchedulePoll {
  id: string;
  trip_id: string;
  title: string;
  description: string | null;
  created_by: string;
  created_at: string;
  poll_dates?: PollDate[];
}

export interface PollDate {
  id: string;
  poll_id: string;
  date: string;
  label: string | null;
  poll_responses?: PollResponseRow[];
}

export interface PollResponseRow {
  id: string;
  poll_id: string;
  date_id: string;
  user_id: string;
  response: PollResponse;
}

export interface Activity {
  id: string;
  trip_id: string;
  date: string;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string | null;
  end_time: string | null;
  sort_order: number;
}

export interface Memo {
  id: string;
  tripId: string;
  activityId?: string | null;
  title: string;
  content: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Expense {
  id: string;
  trip_id: string;
  description: string;
  amount: number;
  paid_by: string;
  created_at: string;
  expense_splits?: ExpenseSplit[];
  profiles?: Profile;
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  share_amount: number;
}

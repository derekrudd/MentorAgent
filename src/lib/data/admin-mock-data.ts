import type { LucideIcon } from "lucide-react";
import {
  MessageSquare,
  MessagesSquare,
  Users,
  Clock,
  GitBranch,
  Timer,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Overview Stats
// ---------------------------------------------------------------------------

export interface OverviewStat {
  label: string;
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  change: number; // percentage, positive = up
  changeLabel: string;
  icon: LucideIcon;
}

export const OVERVIEW_STATS: OverviewStat[] = [
  {
    label: "Total Conversations",
    value: 847,
    change: 12.3,
    changeLabel: "vs last month",
    icon: MessageSquare,
  },
  {
    label: "Messages Sent",
    value: 12453,
    change: 8.7,
    changeLabel: "vs last month",
    icon: MessagesSquare,
  },
  {
    label: "Active Students",
    value: 156,
    change: 5.2,
    changeLabel: "vs last month",
    icon: Users,
  },
  {
    label: "Avg Response Time",
    value: 1.2,
    decimals: 1,
    suffix: "s",
    change: -15.4,
    changeLabel: "vs last month",
    icon: Clock,
  },
  {
    label: "Thread Discussions",
    value: 89,
    change: 22.1,
    changeLabel: "vs last month",
    icon: GitBranch,
  },
  {
    label: "Avg Session Length",
    value: 14,
    suffix: " min",
    change: 3.8,
    changeLabel: "vs last month",
    icon: Timer,
  },
];

// ---------------------------------------------------------------------------
// Mentor Usage
// ---------------------------------------------------------------------------

export interface MentorUsageStat {
  mentorName: string;
  mentorRole: string;
  mentorImage: string;
  conversations: number;
  messages: number;
  uniqueStudents: number;
  avgRating: number;
  percentOfTotal: number;
}

export const MENTOR_USAGE: MentorUsageStat[] = [
  {
    mentorName: "Jordan",
    mentorRole: "Mentor Therapist",
    mentorImage: "/mentors/jordan.png",
    conversations: 312,
    messages: 4821,
    uniqueStudents: 98,
    avgRating: 4.7,
    percentOfTotal: 55,
  },
  {
    mentorName: "Kathia",
    mentorRole: "Mentor Manager",
    mentorImage: "/mentors/kathia.png",
    conversations: 289,
    messages: 4156,
    uniqueStudents: 87,
    avgRating: 4.8,
    percentOfTotal: 45,
  },
];

// ---------------------------------------------------------------------------
// Student Activity
// ---------------------------------------------------------------------------

export type EngagementLevel = "high" | "medium" | "low";

export interface StudentActivity {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
  totalConversations: number;
  totalMessages: number;
  favoriteMentor: string;
  lastActive: string; // ISO string
  engagementLevel: EngagementLevel;
}

export const STUDENT_ACTIVITY: StudentActivity[] = [
  {
    id: "1",
    name: "Maria Santos",
    email: "msantos@depaul.edu",
    avatarInitials: "MS",
    totalConversations: 23,
    totalMessages: 187,
    favoriteMentor: "Jordan",
    lastActive: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    engagementLevel: "high",
  },
  {
    id: "2",
    name: "James Chen",
    email: "jchen42@depaul.edu",
    avatarInitials: "JC",
    totalConversations: 19,
    totalMessages: 156,
    favoriteMentor: "Kathia",
    lastActive: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    engagementLevel: "high",
  },
  {
    id: "3",
    name: "Aisha Johnson",
    email: "ajohnson@depaul.edu",
    avatarInitials: "AJ",
    totalConversations: 17,
    totalMessages: 134,
    favoriteMentor: "Jordan",
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    engagementLevel: "high",
  },
  {
    id: "4",
    name: "Derek Williams",
    email: "dwilliams@depaul.edu",
    avatarInitials: "DW",
    totalConversations: 14,
    totalMessages: 98,
    favoriteMentor: "Jordan",
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    engagementLevel: "medium",
  },
  {
    id: "5",
    name: "Sofia Reyes",
    email: "sreyes@depaul.edu",
    avatarInitials: "SR",
    totalConversations: 12,
    totalMessages: 89,
    favoriteMentor: "Kathia",
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    engagementLevel: "medium",
  },
  {
    id: "6",
    name: "Tyler Brooks",
    email: "tbrooks@depaul.edu",
    avatarInitials: "TB",
    totalConversations: 11,
    totalMessages: 76,
    favoriteMentor: "Kathia",
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    engagementLevel: "medium",
  },
  {
    id: "7",
    name: "Priya Patel",
    email: "ppatel@depaul.edu",
    avatarInitials: "PP",
    totalConversations: 8,
    totalMessages: 52,
    favoriteMentor: "Jordan",
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    engagementLevel: "medium",
  },
  {
    id: "8",
    name: "Marcus Thompson",
    email: "mthompson@depaul.edu",
    avatarInitials: "MT",
    totalConversations: 5,
    totalMessages: 31,
    favoriteMentor: "Kathia",
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    engagementLevel: "low",
  },
  {
    id: "9",
    name: "Emma Liu",
    email: "eliu@depaul.edu",
    avatarInitials: "EL",
    totalConversations: 4,
    totalMessages: 24,
    favoriteMentor: "Jordan",
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    engagementLevel: "low",
  },
  {
    id: "10",
    name: "Carlos Mendez",
    email: "cmendez@depaul.edu",
    avatarInitials: "CM",
    totalConversations: 3,
    totalMessages: 18,
    favoriteMentor: "Jordan",
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    engagementLevel: "low",
  },
];

// ---------------------------------------------------------------------------
// Daily Activity (last 7 days)
// ---------------------------------------------------------------------------

export interface DailyActivity {
  day: string;
  conversations: number;
  messages: number;
}

export const DAILY_ACTIVITY: DailyActivity[] = [
  { day: "Mon", conversations: 34, messages: 412 },
  { day: "Tue", conversations: 41, messages: 523 },
  { day: "Wed", conversations: 38, messages: 478 },
  { day: "Thu", conversations: 52, messages: 634 },
  { day: "Fri", conversations: 47, messages: 589 },
  { day: "Sat", conversations: 18, messages: 198 },
  { day: "Sun", conversations: 22, messages: 267 },
];

// ---------------------------------------------------------------------------
// Engagement Tips
// ---------------------------------------------------------------------------

export type TipCategory = "onboarding" | "retention" | "depth" | "breadth";

export interface EngagementTip {
  id: string;
  title: string;
  description: string;
  category: TipCategory;
  impact: "high" | "medium";
}

export const ENGAGEMENT_TIPS: EngagementTip[] = [
  {
    id: "1",
    title: "Assign First-Week Mentor Conversations",
    description:
      "Students who have at least one mentor conversation in their first week are 3x more likely to become regular users. Add a required intro assignment.",
    category: "onboarding",
    impact: "high",
  },
  {
    id: "2",
    title: "Promote MentorThreads for Group Projects",
    description:
      "Thread usage is up 22% but only 34% of students have tried it. Encourage teams to use multi-mentor threads for cross-functional project feedback.",
    category: "breadth",
    impact: "high",
  },
  {
    id: "3",
    title: "Highlight Skill Badges as Conversation Starters",
    description:
      "Students who click skill badges before typing send 40% more messages per session. Surface skill suggestions more prominently in the empty state.",
    category: "depth",
    impact: "medium",
  },
  {
    id: "4",
    title: "Send Weekly Engagement Digests",
    description:
      "A short email showing students their activity summary and suggesting a follow-up topic can re-engage 25% of inactive users within 48 hours.",
    category: "retention",
    impact: "high",
  },
  {
    id: "5",
    title: "Create Domain-Specific Prompt Templates",
    description:
      "Students often don't know what to ask. Providing starter prompts like 'Review my business plan' or 'Help me prep for an interview' reduces blank-page anxiety.",
    category: "onboarding",
    impact: "medium",
  },
  {
    id: "6",
    title: "Encourage Cross-Mentor Exploration",
    description:
      "58% of students only use one mentor. Prompt them to try a different advisor after 5 conversations — varied perspectives improve learning outcomes.",
    category: "breadth",
    impact: "medium",
  },
];

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Mentor {
  id: string;
  name: string;
  role: string;
  avatar_url: string | null;
  personality: string;
  communication_style: string;
  system_prompt: string;
  greeting_message: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  skills?: MentorSkill[];
}

export interface MentorSkill {
  id: string;
  mentor_id: string;
  name: string;
  display_name: string;
  description: string;
  category: string;
  trigger_phrases: string[];
  is_active: boolean;
}

export interface Conversation {
  id: string;
  mentor_id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  skill_used: string | null;
  status: "generating" | null;
  created_at: string;
}

// -- MentorThreads (multi-mentor collaborative conversations) --

export type ThreadMessageSenderType = "user" | "mentor" | "system";

export interface MentorThread {
  id: string;
  user_id: string;
  title: string;
  status: "active" | "completed";
  max_turns: number;
  created_at: string;
  updated_at: string;
  participants?: MentorThreadParticipant[];
  messages?: MentorThreadMessage[];
}

export interface MentorThreadParticipant {
  id: string;
  thread_id: string;
  mentor_id: string;
  role: "participant";
  joined_at: string;
  mentor?: Mentor;
}

export interface MentorThreadMessage {
  id: string;
  thread_id: string;
  sender_type: ThreadMessageSenderType;
  sender_mentor_id: string | null;
  content: string;
  skill_used: string | null;
  status: "generating" | null;
  created_at: string;
  sender_mentor?: Mentor;
}

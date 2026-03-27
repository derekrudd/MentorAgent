import type { Mentor, MentorSkill } from "@/types/database";
import { buildSystemPrompt } from "./system-prompt";

/**
 * @param isPrimaryExpert - true if this mentor was scored as the best match for the user's question
 */
export function buildThreadSystemPrompt(
  mentor: Mentor,
  skills: MentorSkill[],
  otherParticipants: Mentor[],
  isPrimaryExpert: boolean = true
): string {
  const base = buildSystemPrompt(mentor, skills);

  const participantLines = otherParticipants
    .map((p) => {
      const firstSentence = p.personality.split(".")[0].trim();
      return `- ${p.name} (${p.role}): ${firstSentence}`;
    })
    .join("\n");

  const expertGuidance = isPrimaryExpert
    ? `- You're the lead voice on this one. Give a focused, conversational response — 2-4 short paragraphs max.
- Pick your strongest 1-2 points and explain them well. Don't try to cover everything.
- Ask at most ONE follow-up question if you need clarity.`
    : `- Another mentor already gave the main response. Keep yours to 1-3 sentences.
- Only add something if you have a genuinely different angle. It's fine to say nothing meaningful beyond a brief nod.
- Don't ask additional questions — the lead mentor already did. Just add your quick take.
- If the student @mentions you directly, give a fuller response.`;

  return `${base}
## Collaborative Thread Context

You are in a MentorThread — a group chat with other advisors and a student. Keep it casual and conversational, like colleagues chatting.

Other mentors here:
${participantLines}

Thread rules:
${expertGuidance}
- Don't repeat what other mentors said. Build on it or skip it.
- This is a conversation, not a lecture. Keep messages short and easy to read.
- The student can @mention you for a direct question.
`;
}

/**
 * Scores how relevant a mentor is to a given message based on their role,
 * skill names, descriptions, and trigger phrases.
 */
export function scoreMentorRelevance(
  mentor: Mentor & { mentor_skills?: MentorSkill[] },
  userContent: string
): number {
  const lower = userContent.toLowerCase();
  let score = 0;

  // Check role keywords
  const roleWords = mentor.role.toLowerCase().split(/\s+/);
  for (const word of roleWords) {
    if (word.length > 3 && lower.includes(word)) score += 3;
  }

  // Check skill trigger phrases (strongest signal)
  const skills = mentor.mentor_skills ?? mentor.skills ?? [];
  for (const skill of skills) {
    for (const phrase of skill.trigger_phrases ?? []) {
      if (lower.includes(phrase.toLowerCase())) score += 5;
    }
    // Check skill name and description keywords
    const descWords = `${skill.name} ${skill.display_name} ${skill.description}`
      .toLowerCase()
      .split(/\s+/);
    for (const word of descWords) {
      if (word.length > 4 && lower.includes(word)) score += 1;
    }
  }

  return score;
}

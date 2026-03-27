"use client";

import useSWR from "swr";
import { getMentors, getMentor } from "@/lib/actions/mentors";

export function useMentors() {
  return useSWR("mentors", () => getMentors());
}

export function useMentor(id: string) {
  return useSWR(id ? `mentor-${id}` : null, () => getMentor(id));
}

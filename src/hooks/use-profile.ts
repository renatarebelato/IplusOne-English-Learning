import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string; display_name: string | null; language: string; level: string;
  daily_goal: number; deck_name: string; reminder_enabled: boolean;
};

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile | null> => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      if (data) return data as Profile;
      const fallback = { id: u.user.id, display_name: u.user.email?.split("@")[0] ?? null };
      const { data: created } = await supabase.from("profiles").insert(fallback).select("*").single();
      return created as Profile;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return async (patch: Partial<Profile>) => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("profiles").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", u.user.id);
    await qc.invalidateQueries({ queryKey: ["profile"] });
    return error;
  };
}

export function useStudyDays() {
  return useQuery({
    queryKey: ["study_days"],
    queryFn: async () => {
      const { data } = await supabase.from("study_days").select("*").order("study_date", { ascending: false });
      return data ?? [];
    },
  });
}

export function useWords() {
  return useQuery({
    queryKey: ["words"],
    queryFn: async () => {
      const { data } = await supabase.from("words").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });
}

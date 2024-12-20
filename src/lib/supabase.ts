import { createClient } from "@supabase/supabase-js";

export async function createSupabaseClient() {
  const { supabaseUrl, supabasePrivateKey } = await chrome.storage.sync.get([
    "supabaseUrl",
    "supabasePrivateKey",
  ]);

  if (!supabaseUrl || !supabasePrivateKey) {
    throw new Error("Supabase credentials not found");
  }
  return createClient(supabaseUrl, supabasePrivateKey);
}

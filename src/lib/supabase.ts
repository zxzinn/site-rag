import { createClient } from "@supabase/supabase-js";

export async function createSupabaseClient() {
  let supabaseUrl: string | undefined = undefined;
  let supabasePrivateKey: string | undefined = undefined;
  try {
    if (chrome) {
      const results = await chrome.storage.sync.get([
        "supabaseUrl",
        "supabasePrivateKey",
      ]);
      supabaseUrl = results.supabaseUrl;
      supabasePrivateKey = results.supabasePrivateKey;
    }
  } catch (_) {
    supabaseUrl = process.env.SUPABASE_URL;
    supabasePrivateKey = process.env.SUPABASE_PRIVATE_KEY;
  }

  if (!supabaseUrl || !supabasePrivateKey) {
    throw new Error("Supabase credentials not found");
  }
  return createClient(supabaseUrl, supabasePrivateKey);
}

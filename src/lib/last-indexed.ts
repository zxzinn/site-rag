import { createSupabaseClient } from "./supabase";

export async function getLastIndexed(url: string) {
  const { supabaseUrl, supabasePrivateKey } = await chrome.storage.sync.get([
    "supabaseUrl",
    "supabasePrivateKey",
  ]);

  if (!supabaseUrl || !supabasePrivateKey) {
    throw new Error("Supabase credentials not found");
  }

  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from("documents")
    .select("metadata->>_indexed_at")
    .eq("metadata->>url", url)
    .order("metadata->>_indexed_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    throw error;
  }

  return data?._indexed_at;
}

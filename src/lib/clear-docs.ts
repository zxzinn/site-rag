import { createSupabaseClient } from "@/lib/supabase";

async function clearDocs({ currentUrls }: { currentUrls: string[] }) {
  const supabase = await createSupabaseClient();

  const { error } = await supabase
    .from("documents")
    .delete()
    .in("metadata->>url", currentUrls);

  if (error) {
    throw error;
  }

  console.log(`Successfully deleted documents for URLs:`, currentUrls);
}

export default clearDocs;

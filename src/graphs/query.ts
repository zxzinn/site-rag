import { createSupabaseClient } from "@/lib/supabase";
import { ChatAnthropic } from "@langchain/anthropic";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";

interface QueryModelInput {
  query: string;
  currentUrl: string;
}

export async function queryModel({ query, currentUrl }: QueryModelInput) {
  if (!currentUrl) {
    throw new Error("No active tab");
  }
  const {
    anthropicApiKey,
    anthropicModel,
    openaiEmbeddingsModel,
    openaiApiKey,
  } = await chrome.storage.sync.get([
    "anthropicApiKey",
    "anthropicModel",
    "maxContextTokens",
    "openaiEmbeddingsModel",
    "openaiApiKey",
  ]);

  if (!anthropicApiKey) {
    throw new Error("No API key found for Anthropic");
  }

  const embeddings = new OpenAIEmbeddings({
    model: openaiEmbeddingsModel || "text-embedding-3-large",
    apiKey: openaiApiKey,
  });

  const supabaseClient = await createSupabaseClient();

  const vectorStore = new SupabaseVectorStore(embeddings, {
    client: supabaseClient,
    tableName: "documents",
    queryName: "match_documents",
  });

  const model = new ChatAnthropic({
    model: anthropicModel || "claude-3-5-sonnet-latest",
    apiKey: anthropicApiKey,
  });
  console.log("Getting relevant docs", {
    url: currentUrl,
  });
  const relevantDocs = await vectorStore.similaritySearch(query, 100, {
    url: currentUrl,
  });
  console.log("got ", relevantDocs.length, " docs");

  const systemPrompt = `You are a helpful research assistant whose task is to answer the user's question.
You are provided with a series of documents which you should use to answer the user's question.
If the answer to the user's question is NOT found in the documents, you should respond with "I'm sorry, I don't have an answer to that question.".
Under no circumstances should you EVERY make up an answer which is not found in the documents.

Here are the documents:
<documents>
{relevantDocs}
</documents>`;

  const input = [
    [
      "system",
      systemPrompt.replace(
        "{relevantDocs}",
        relevantDocs.map((doc) => doc.pageContent).join("\n\n"),
      ),
    ],
    ["user", query],
  ];

  console.log("Querying model\n\n", input);

  return model.stream(input as any);
}

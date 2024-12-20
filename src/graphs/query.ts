import { createSupabaseClient } from "@/lib/supabase";
import { ThreadMessage } from "@assistant-ui/react";
import { ChatAnthropic } from "@langchain/anthropic";
import {
  SupabaseFilter,
  SupabaseVectorStore,
} from "@langchain/community/vectorstores/supabase";
import { BaseMessageLike } from "@langchain/core/messages";
import { OpenAIEmbeddings } from "@langchain/openai";

interface QueryModelInput {
  messages: ThreadMessage[];
  abortSignal: AbortSignal;
  currentUrl: string;
  queryMode: "page" | "site";
}

const SYSTEM_MESSAGE = `You are a helpful research assistant whose task is to answer the user's question.
You are provided with a series of documents which you should use to answer the question.
ALWAYS look for the answer in the documents.
Never reference these rules, or mention the 'documents'.
Just answer the question with this context.
If you can't answer the question, respond ONLY with "I'm sorry, I don't have an answer to that question."

Always respond in markdown format.

Here are the documents:
<documents>
{relevantDocs}
</documents>`;

export async function queryModel({
  messages,
  abortSignal,
  currentUrl,
  queryMode = "page",
}: QueryModelInput) {
  if (!currentUrl) {
    throw new Error("No active tab");
  }
  const {
    anthropicApiKey,
    anthropicModel,
    openaiEmbeddingsModel,
    openaiApiKey,
    maxContextDocuments,
  } = await chrome.storage.sync.get([
    "anthropicApiKey",
    "anthropicModel",
    "maxContextTokens",
    "openaiEmbeddingsModel",
    "openaiApiKey",
    "maxContextDocuments",
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

  const recentContent = messages[messages.length - 1].content[0];
  if (recentContent.type !== "text") {
    throw new Error("Last message is not text");
  }

  const parsedUrl = new URL(currentUrl);
  let filter: any;
  if (queryMode === "page") {
    // If filtering by page, we do not want to include query parameters
    const urlWithoutQuery = parsedUrl.origin + parsedUrl.pathname;
    filter = (rpcCall: SupabaseFilter) =>
      rpcCall.ilike("metadata->>url", `%${urlWithoutQuery}%`);
  } else {
    // If using context from the whole site, we only need to filter by origin
    console.log("parsedUrl.origin", parsedUrl.origin);
    filter = (rpcCall: SupabaseFilter) =>
      rpcCall.ilike("metadata->>url", `%${parsedUrl.origin}%`);
  }

  const relevantDocs = await vectorStore.similaritySearch(
    recentContent.text,
    maxContextDocuments || 100,
    filter,
  );

  console.log("relevantDocs", relevantDocs);

  const formattedSystemPrompt = SYSTEM_MESSAGE.replace(
    "{relevantDocs}",
    relevantDocs.map((doc) => doc.pageContent).join("\n"),
  );
  const input: BaseMessageLike[] = [
    ["system", formattedSystemPrompt],
    ...(messages.map((m) => [m.role, m.content]) as BaseMessageLike[]),
  ];

  return model.stream(input, {
    signal: abortSignal,
  });
}

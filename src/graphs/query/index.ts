import { Document } from "@langchain/core/documents";
import { createSupabaseClient } from "@/lib/supabase";
import { Model } from "@/types";
import { ThreadMessage } from "@assistant-ui/react";
import {
  SupabaseFilter,
  SupabaseVectorStore,
} from "@langchain/community/vectorstores/supabase";
import { BaseMessageLike } from "@langchain/core/messages";
import { OpenAIEmbeddings } from "@langchain/openai";
import { getSystemPrompt } from "./prompt";
import { getModelClass } from "./utils";
import { generateSearchQueries } from "./generate-queries";

interface QueryModelInput {
  messages: ThreadMessage[];
  abortSignal: AbortSignal;
  currentUrl: string;
  queryMode: "page" | "site";
  model: Model;
  retrievalMode: "base" | "multi";
}

function getVectorStoreFilter(queryMode: "page" | "site", parsedUrl: URL) {
  if (queryMode === "page") {
    // If filtering by page, we do not want to include query parameters
    const urlWithoutQuery = parsedUrl.origin + parsedUrl.pathname;
    console.log("Filtering documents which contain URL", urlWithoutQuery);
    return (rpcCall: SupabaseFilter) =>
      rpcCall.ilike("metadata->>url", `%${urlWithoutQuery}%`);
  } else {
    // If using context from the whole site, we only need to filter by origin
    console.log("Filtering documents which contain URL", parsedUrl.origin);
    return (rpcCall: SupabaseFilter) =>
      rpcCall.ilike("metadata->>url", `%${parsedUrl.origin}%`);
  }
}

export async function queryModel({
  messages,
  abortSignal,
  currentUrl,
  queryMode = "page",
  model: modelName,
  retrievalMode = "base",
}: QueryModelInput) {
  if (!currentUrl) {
    throw new Error("No active tab");
  }
  const { openaiApiKey, maxContextDocuments } = await chrome.storage.sync.get([
    "openaiApiKey",
    "maxContextDocuments",
  ]);

  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-large",
    apiKey: openaiApiKey,
  });
  const supabaseClient = await createSupabaseClient();
  const vectorStore = new SupabaseVectorStore(embeddings, {
    client: supabaseClient,
    tableName: "documents",
    queryName: "match_documents",
  });

  const model = await getModelClass(modelName);

  const recentContent = messages[messages.length - 1].content[0];
  if (recentContent.type !== "text") {
    throw new Error("Last message is not text");
  }

  const parsedUrl = new URL(currentUrl);
  const filter = getVectorStoreFilter(queryMode, parsedUrl);

  let relevantDocs: Document[] = [];
  if (retrievalMode === "multi") {
    const generatedQueries = await generateSearchQueries(
      recentContent.text,
      modelName,
    );
    const allQueries = [recentContent.text, ...generatedQueries];
    const maxDocsPerQueryUnparsed =
      (maxContextDocuments || 100) / allQueries.length;
    const maxDocsPerQuery = Math.ceil(Math.max(maxDocsPerQueryUnparsed, 5)); // Generate at least 5 documents per query
    console.log("Fetching", maxDocsPerQuery, "documents per query");
    const documents: Document[] = [];
    for await (const query of allQueries) {
      const docs = await vectorStore.similaritySearch(
        query,
        maxDocsPerQuery,
        filter,
      );
      if (!docs[0].id) {
        throw new Error("No documents found.");
      }
      documents.push(...docs);
    }
    const uniqueDocIds = new Set<string>();
    const uniqueDocs: Document[] = [];

    // Keep only the first occurrence of each document ID
    for (const doc of documents) {
      const id = doc.id || "";
      if (!uniqueDocIds.has(id)) {
        uniqueDocIds.add(id);
        uniqueDocs.push(doc);
      }
    }

    relevantDocs = uniqueDocs;
    console.log(
      "Searched documents using",
      allQueries.length,
      "queries (including the original query, plus the generated queries)",
    );
  } else {
    relevantDocs = await vectorStore.similaritySearch(
      recentContent.text,
      maxContextDocuments || 100,
      filter,
    );
  }

  console.log("Got", relevantDocs.length, "relevant docs");

  const systemPrompt = await getSystemPrompt();
  const formattedSystemPrompt = systemPrompt.replace(
    "{relevantDocs}",
    relevantDocs.map((doc) => doc.pageContent).join("\n"),
  );
  // yield formattedSystemPrompt;
  const input: BaseMessageLike[] = [
    ["system", formattedSystemPrompt],
    ...(messages.map((m) => [m.role, m.content]) as BaseMessageLike[]),
  ];

  return model.stream(input, {
    signal: abortSignal,
  });
}

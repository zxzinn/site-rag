import { Document } from "@langchain/core/documents";
import { createSupabaseClient } from "@/lib/supabase";
import { Model } from "@/types";
import { TextContentPart, ThreadMessage } from "@assistant-ui/react";
import {
  SupabaseFilter,
  SupabaseVectorStore,
} from "@langchain/community/vectorstores/supabase";
import { BaseMessageLike } from "@langchain/core/messages";
import { OpenAIEmbeddings } from "@langchain/openai";
import { DEFAULT_SYSTEM_PROMPT } from "./prompt";
import { getModelClass } from "./utils";
import { generateSearchQueries } from "./generate-queries";
import { scrape } from "../_index";
import { getDataFromIndexedDB, storeDataInIndexedDB } from "@/lib/index-db";

interface QueryModelInput {
  messages: ThreadMessage[];
  abortSignal: AbortSignal;
  currentUrl: string;
  queryMode: "page" | "site";
  model: Model;
  retrievalMode: "base" | "multi";
  contextStuff: boolean;
  sessionId: string;
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

interface ContextStuffQuery {
  currentUrl: string;
  messages: ThreadMessage[];
  modelName: Model;
  abortSignal?: AbortSignal;
}

type StoredSystemPrompt = {
  prompt: string;
  createdAt: string;
};

async function contextStuffQuery({
  messages,
  currentUrl,
  modelName,
  abortSignal,
}: ContextStuffQuery) {
  const { fireCrawlApiKey } = await chrome.storage.sync.get([
    "fireCrawlApiKey",
  ]);

  const systemPromptKey = `systemPrompt-${currentUrl}`;
  const systemPromptResult =
    await getDataFromIndexedDB<StoredSystemPrompt>(systemPromptKey);

  let systemPrompt: string | undefined = systemPromptResult?.prompt;

  if (!systemPrompt) {
    const docs = await scrape(currentUrl, {
      fireCrawlApiKey,
    });
    const docsText = docs.map((d) => d.pageContent).join("\n");

    systemPrompt = DEFAULT_SYSTEM_PROMPT.replace("{relevantDocs}", docsText);

    await storeDataInIndexedDB<StoredSystemPrompt>(systemPromptKey, {
      prompt: systemPrompt,
      createdAt: new Date().toISOString(),
    });
  }

  const input: BaseMessageLike[] = [
    ["system", systemPrompt],
    ...(messages.map((m) => [m.role, m.content]) as BaseMessageLike[]),
  ];
  const model = await getModelClass(modelName);
  return model.stream(input, {
    signal: abortSignal,
  });
}

interface MultiQueryRetrievalInput {
  recentContent: TextContentPart;
  modelName: Model;
  maxContextDocuments?: number;
  vectorStore: SupabaseVectorStore;
  filter: (rpcCall: SupabaseFilter) => SupabaseFilter;
}

async function multiQueryRetrieval({
  recentContent,
  modelName,
  maxContextDocuments,
  vectorStore,
  filter,
}: MultiQueryRetrievalInput) {
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
    // TODO: Uncomment once IDs PR is fixed.
    // if (!docs[0].id) {
    //   throw new Error("No documents found.");
    // }
    documents.push(...docs);
  }
  // const uniqueDocIds = new Set<string>();
  const uniqueDocContents = new Set<string>();
  const uniqueDocs: Document[] = [];

  // Keep only the first occurrence of each document ID
  for (const doc of documents) {
    // const id = doc.id || "";
    // if (!uniqueDocIds.has(id)) {
    //   uniqueDocIds.add(id);
    //   uniqueDocs.push(doc);
    // }
    if (!uniqueDocContents.has(doc.pageContent)) {
      uniqueDocContents.add(doc.pageContent);
      uniqueDocs.push(doc);
    }
  }

  console.log(
    "Searched documents using",
    allQueries.length,
    "queries (including the original query, plus the generated queries)",
  );
  return uniqueDocs;
}

interface RetrieveContextInput {
  modelName: Model;
  messages: ThreadMessage[];
  currentUrl: string;
  queryMode: "page" | "site";
  retrievalMode: "base" | "multi";
}

async function retrieveContext({
  modelName,
  messages,
  currentUrl,
  queryMode,
  retrievalMode,
}: RetrieveContextInput) {
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

  const recentContent = messages[messages.length - 1].content[0];
  if (recentContent.type !== "text") {
    throw new Error("Last message is not text");
  }

  const parsedUrl = new URL(currentUrl);
  const filter = getVectorStoreFilter(queryMode, parsedUrl);

  let relevantDocs: Document[] = [];
  if (retrievalMode === "multi") {
    relevantDocs = await multiQueryRetrieval({
      recentContent,
      modelName,
      maxContextDocuments,
      vectorStore,
      filter,
    });
  } else {
    relevantDocs = await vectorStore.similaritySearch(
      recentContent.text,
      maxContextDocuments || 100,
      filter,
    );
  }

  return relevantDocs;
}

type RelevantDocsStorage = {
  relevantDocs: Array<{
    messageIndex: number;
    docs: string;
  }>;
};

async function getPreviousRelevantDocs(sessionId: string) {
  const storageKey = `relevant-docs-${sessionId}`;
  return getDataFromIndexedDB<RelevantDocsStorage>(storageKey);
}

interface StoreDocsArgs {
  docsText: string;
  sessionId: string;
  messageIndex: number;
  existingRelevantDocs: RelevantDocsStorage;
}

async function storeDocs(args: StoreDocsArgs) {
  const storageKey = `relevant-docs-${args.sessionId}`;

  await storeDataInIndexedDB<RelevantDocsStorage>(storageKey, {
    relevantDocs: [
      ...(args.existingRelevantDocs?.relevantDocs || []),
      {
        messageIndex: args.messageIndex,
        docs: args.docsText,
      },
    ],
  });
}

/**
 * Formats an array of messages for model input by injecting relevant context before user messages.
 * For each user message (except the last one), it adds a preceding message containing relevant document
 * context from previous interactions.
 *
 * @param messages - Array of thread messages to be formatted
 * @param existingRelevantDocs - Storage object containing relevant documents mapped to message indices
 * @param formattedSystemPrompt - System prompt to be included at the start of the message array
 * @returns An array of BaseMessageLike tuples, each containing a role and content
 * @throws Logs an error if no relevant document is found for a message index
 */
function formatMessages(
  messages: ThreadMessage[],
  existingRelevantDocs: RelevantDocsStorage,
  formattedSystemPrompt: string,
): BaseMessageLike[] {
  const formattedMessages: BaseMessageLike[] = [
    ["system", formattedSystemPrompt],
  ];
  if (messages.length === 1) {
    // Only 1 message means the context is already included in the system prompt
    return [...formattedMessages, ["user", messages[0].content]];
  }

  messages.forEach((message, index) => {
    // If it's a human message and not the last message, add context before it
    if (message.role === "user" && index < messages.length - 1) {
      const relevantDoc = existingRelevantDocs?.relevantDocs?.find(
        (doc) => doc.messageIndex === index + 1,
      );
      if (!relevantDoc) {
        console.error(
          `No relevant doc found for message index ${index}. Available docs: ${existingRelevantDocs.relevantDocs.map((doc) => doc.messageIndex).join(", ")}`,
        );
        return;
      }
      formattedMessages.push([
        "human",
        `Use this context to answer the following question\n<context>\n${relevantDoc.docs}\n</context>`,
      ]);
    }
    formattedMessages.push([message.role, message.content]);
  });

  return formattedMessages;
}

export async function queryModel({
  messages,
  abortSignal,
  currentUrl,
  queryMode = "page",
  model: modelName,
  retrievalMode = "base",
  contextStuff,
  sessionId,
}: QueryModelInput) {
  if (!currentUrl) {
    throw new Error("No active tab");
  }
  if (contextStuff) {
    return contextStuffQuery({ messages, currentUrl, modelName, abortSignal });
  }

  const relevantDocs = await retrieveContext({
    modelName,
    messages,
    currentUrl,
    queryMode,
    retrievalMode,
  });
  const relevantDocsText = relevantDocs
    .map((doc) => doc.pageContent)
    .join("\n");

  const formattedSystemPrompt = DEFAULT_SYSTEM_PROMPT.replace(
    "{relevantDocs}",
    relevantDocsText,
  );

  const existingRelevantDocs = await getPreviousRelevantDocs(sessionId);

  // Save the relevant docs so they can be retrieved in following queries
  await storeDocs({
    docsText: relevantDocsText,
    sessionId,
    messageIndex: messages.length,
    existingRelevantDocs,
  });

  const input = formatMessages(
    messages,
    existingRelevantDocs,
    formattedSystemPrompt,
  );

  const model = await getModelClass(modelName);

  return model.stream(input, {
    signal: abortSignal,
  });
}

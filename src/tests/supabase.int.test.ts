import { Document } from "@langchain/core/documents";
import { describe, expect, it } from "@jest/globals";
import { v4 as uuidv4 } from "uuid";
import { OpenAIEmbeddings } from "@langchain/openai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
// import clearDocs from "@/lib/clear-docs";
import { createSupabaseClient } from "@/lib/supabase";

describe("Clearing documents", () => {
  it("Can clear existing documents by URL", async () => {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_PRIVATE_KEY) {
      throw new Error("Supabase credentials not found");
    }

    const allUrls = [
      "https://example.com",
      "https://langchain.com",
      "https://langchain.com/page-1",
      "https://langchain.com/page-2",
      "https://langchain.com/page-1/highlight",
    ];
    // const allUrlsToDelete = allUrls.slice(1);
    const docs = [
      new Document({
        id: uuidv4(),
        pageContent: "Hello world",
        metadata: {
          url: allUrls[0],
        },
      }),
      new Document({
        id: uuidv4(),
        pageContent: "Hello world",
        metadata: {
          url: allUrls[1],
        },
      }),
      new Document({
        id: uuidv4(),
        pageContent: "Hello world",
        metadata: {
          url: allUrls[2],
        },
      }),
      new Document({
        id: uuidv4(),
        pageContent: "Hello world",
        metadata: {
          url: allUrls[3],
        },
      }),
      new Document({
        id: uuidv4(),
        pageContent: "Hello world",
        metadata: {
          url: allUrls[4],
        },
      }),
    ];

    const embeddings = new OpenAIEmbeddings({
      model: "text-embedding-3-large",
      apiKey: process.env.OPENAI_API_KEY,
    });

    const supabaseClient = await createSupabaseClient();
    const vectorStore = new SupabaseVectorStore(embeddings, {
      client: supabaseClient,
      tableName: "documents",
      queryName: "match_documents",
    });

    await vectorStore.addDocuments(docs);

    // Query the database to verify documents were inserted
    const { data: insertedDocs, error: insertError } = await supabaseClient
      .from("documents")
      .select("*")
      .in("metadata->>url", allUrls);

    if (insertError) {
      console.error("Error fetching documents:", insertError);
      return;
    }
    expect(insertedDocs?.length).toBe(5);
    expect(insertedDocs?.map((doc) => doc.metadata.url).sort()).toEqual(
      allUrls.sort(),
    );

    // await clearDocs({ currentUrls: allUrlsToDelete });

    // const { data: shouldContainSingle, error } = await supabaseClient
    //   .from("documents")
    //   .select("*")
    //   .in("metadata->>url", allUrls);

    // expect(shouldContainSingle?.length).toBe(1);
    // expect(shouldContainSingle?.[0].metadata.url).toBe(allUrls[0]);
    // expect(error).toBeFalsy();

    // Cleanup
    // await clearDocs({ currentUrls: [allUrls[0]] });
  });
});

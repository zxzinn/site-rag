import {
  GENERATE_QUERIES_SYSTEM_MESSAGE,
  GENERATE_QUERIES_USER_MESSAGE,
} from "./prompt";
import { getModelClass } from "./utils";
import { z } from "zod";
import { ALL_MODEL_NAMES } from "@/constants";
import { getInitialMessageRole } from "@/lib/utils";

/**
 * Generate semantically similar queries to the original query. Used in "multi-query" mode
 * to retrieve documents for context.
 * @param {string} query The base query to expand on
 * @param {ALL_MODEL_NAMES} modelName The name of the model to use to generate the queries
 * @returns {Promise<string[]>} A list of 3-5 semantically similar queries to the original query
 */
export async function generateSearchQueries(
  query: string,
  modelName: ALL_MODEL_NAMES,
): Promise<string[]> {
  const model = await getModelClass(modelName, {
    temperature: 1,
  });
  const schema = z
    .object({
      queries: z
        .array(z.string())
        .describe(
          "A list of 3-5 semantically similar queries to the original question",
        ),
    })
    .describe("The semantically similar search queries");

  const modelWithStructuredOutput = model.withStructuredOutput(schema, {
    name: "generated_search_queries",
  });
  const formattedUserMessage = GENERATE_QUERIES_USER_MESSAGE.replace(
    "{query}",
    query,
  );

  const result = await modelWithStructuredOutput.invoke([
    [getInitialMessageRole(modelName), GENERATE_QUERIES_SYSTEM_MESSAGE],
    ["user", formattedUserMessage],
  ]);

  return result.queries.slice(0, 5);
}

import { Model } from "@/types";
import { initChatModel } from "langchain/chat_models/universal";

const modelNameToProviderMap: Record<Model, string> = {
  "gpt-4o": "openai",
  "gpt-4o-mini": "openai",
  "o1-preview": "openai",
  "o1-mini": "openai",
  "claude-3-5-haiku-latest": "anthropic",
  "claude-3-5-sonnet-latest": "anthropic",
  "claude-3-opus-latest": "anthropic",
  "gemini-1.5-flash": "google-genai",
  "google-1.5-pro": "google-genai",
  "gemini-2.0-flash-exp": "google-genai",
};

export async function getModelClass(
  model: Model,
  options?: {
    temperature?: number;
  },
) {
  const provider = modelNameToProviderMap[model];
  if (!provider) {
    throw new Error(`Unknown model: ${model}`);
  }
  const { anthropicApiKey, openaiApiKey, googleGenAIApiKey } =
    await chrome.storage.sync.get([
      "anthropicApiKey",
      "openaiApiKey",
      "googleGenAIApiKey",
    ]);
  let apiKey = "";
  if (provider === "anthropic") {
    apiKey = anthropicApiKey;
  } else if (provider === "openai") {
    apiKey = openaiApiKey;
  } else if (provider === "google-genai") {
    apiKey = googleGenAIApiKey;
  }

  return initChatModel(model, {
    modelProvider: provider,
    temperature: options?.temperature ?? 0,
    apiKey,
  });
}

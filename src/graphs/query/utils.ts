import { ALL_MODEL_NAMES } from "@/constants";
import { initChatModel } from "langchain/chat_models/universal";

const modelNameToProviderMap: Record<ALL_MODEL_NAMES, string> = {
  // OpenAI models
  "gpt-4o": "openai",
  "gpt-4o-mini": "openai",
  "o3-mini": "openai",
  "o1-mini": "openai",
  o1: "openai",
  // Ollama models
  "ollama-llama3.3": "ollama",
  // Anthropic models
  "claude-3-5-sonnet-latest": "anthropic",
  "claude-3-5-haiku-20241022": "anthropic",
  // Fireworks models
  "accounts/fireworks/models/llama-v3p3-70b-instruct": "fireworks",
  "accounts/fireworks/models/deepseek-v3": "fireworks",
  "accounts/fireworks/models/deepseek-r1": "fireworks",
  // Gemini models
  "gemini-2.0-flash-exp": "google-genai",
  "gemini-2.0-flash-thinking-exp-01-21": "google-genai",
};

export async function getModelClass(
  model: ALL_MODEL_NAMES,
  options?: {
    temperature?: number;
  },
) {
  const provider = modelNameToProviderMap[model];
  if (!provider) {
    throw new Error(`Unknown model: ${model}`);
  }

  const { anthropicApiKey, openaiApiKey, googleGenAIApiKey, fireworksApiKey } =
    await chrome.storage.sync.get([
      "anthropicApiKey",
      "openaiApiKey",
      "googleGenAIApiKey",
      "fireworksApiKey",
    ]);

  let apiKey = "";
  if (provider === "anthropic") {
    apiKey = anthropicApiKey;
  } else if (provider === "openai") {
    apiKey = openaiApiKey;
  } else if (provider === "google-genai") {
    apiKey = googleGenAIApiKey;
  } else if (provider === "fireworks") {
    apiKey = fireworksApiKey;
  } else if (provider === "ollama") {
    // Ollama is local, no API key needed
    apiKey = "";
  }

  const supportsTemperature = !(
    model.startsWith("o1") || model.startsWith("o3")
  );

  return initChatModel(model, {
    modelProvider: provider,
    ...(supportsTemperature ? { temperature: options?.temperature ?? 0 } : {}),
    ...(apiKey ? { apiKey } : {}),
  });
}

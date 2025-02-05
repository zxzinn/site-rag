import { ALL_MODEL_NAMES, MODEL_NAME_PROVIDER_MAP } from "@/constants";
import { initChatModel } from "langchain/chat_models/universal";

export async function getModelClass(
  model: ALL_MODEL_NAMES,
  options?: {
    temperature?: number;
  },
) {
  const provider = MODEL_NAME_PROVIDER_MAP[model];
  if (!provider) {
    throw new Error(`Unknown model: ${model}`);
  }

  const { anthropicApiKey, openaiApiKey, googleGenAIApiKey, togetherApiKey } =
    await chrome.storage.sync.get([
      "anthropicApiKey",
      "openaiApiKey",
      "googleGenAIApiKey",
      "togetherApiKey",
    ]);

  let apiKey = "";
  if (provider === "anthropic") {
    apiKey = anthropicApiKey;
  } else if (provider === "openai") {
    apiKey = openaiApiKey;
  } else if (provider === "google-genai") {
    apiKey = googleGenAIApiKey;
  } else if (provider === "together") {
    apiKey = togetherApiKey;
  } else if (provider === "ollama") {
    // Ollama is local, no API key needed
    apiKey = "";
  }

  const supportsTemperature = !(
    model.startsWith("o1") || model.startsWith("o3")
  );

  const initChatModelArgs = {
    modelProvider: provider,
    ...(supportsTemperature ? { temperature: options?.temperature ?? 0 } : {}),
    ...(apiKey ? { apiKey } : {}),
  };

  return initChatModel(model, initChatModelArgs);
}

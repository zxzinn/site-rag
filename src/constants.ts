import { ModelConfigurationParams } from "./types";

export const OPENAI_MODELS: ModelConfigurationParams[] = [
  {
    name: "gpt-4o",
    label: "GPT-4o",
  },
  {
    name: "gpt-4o-mini",
    label: "GPT-4o mini",
  },
  {
    name: "o3-mini",
    label: "o3 mini",
  },
  {
    name: "o1-mini",
    label: "o1 mini",
  },
  {
    name: "o1",
    label: "o1",
  },
];

/**
 * Ollama model names _MUST_ be prefixed with `"ollama-"`
 */
export const OLLAMA_MODELS = [
  {
    name: "ollama-llama3.3",
    label: "Llama 3.3 70B (local)",
  },
];

export const ANTHROPIC_MODELS = [
  {
    name: "claude-3-5-sonnet-latest",
    label: "Claude 3.5 Sonnet",
  },
  {
    name: "claude-3-5-haiku-20241022",
    label: "Claude 3.5 Haiku",
  },
];

export const FIREWORKS_MODELS: ModelConfigurationParams[] = [
  {
    name: "accounts/fireworks/models/llama-v3p3-70b-instruct",
    label: "Llama 3.3 70B",
  },
  {
    name: "accounts/fireworks/models/deepseek-v3",
    label: "DeepSeek V3",
  },
  {
    name: "accounts/fireworks/models/deepseek-r1",
    label: "DeepSeek R1",
  },
];

export const GEMINI_MODELS: ModelConfigurationParams[] = [
  {
    name: "gemini-2.0-flash-exp",
    label: "Gemini 2.0 Flash",
  },
  {
    name: "gemini-2.0-flash-thinking-exp-01-21",
    label: "Gemini 2.0 Flash Thinking",
  },
];

export const ALL_MODELS: ModelConfigurationParams[] = [
  ...OPENAI_MODELS,
  ...ANTHROPIC_MODELS,
  ...FIREWORKS_MODELS,
  ...GEMINI_MODELS,
  ...OLLAMA_MODELS,
];

export type OPENAI_MODEL_NAMES = (typeof OPENAI_MODELS)[number]["name"];
export type ANTHROPIC_MODEL_NAMES = (typeof ANTHROPIC_MODELS)[number]["name"];
export type FIREWORKS_MODEL_NAMES = (typeof FIREWORKS_MODELS)[number]["name"];
export type GEMINI_MODEL_NAMES = (typeof GEMINI_MODELS)[number]["name"];
export type OLLAMA_MODEL_NAMES = (typeof OLLAMA_MODELS)[number]["name"];
export type ALL_MODEL_NAMES =
  | OPENAI_MODEL_NAMES
  | ANTHROPIC_MODEL_NAMES
  | FIREWORKS_MODEL_NAMES
  | GEMINI_MODEL_NAMES
  | OLLAMA_MODEL_NAMES;

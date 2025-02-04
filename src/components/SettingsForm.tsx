import React, { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { DEFAULT_SYSTEM_PROMPT } from "@/graphs/query/prompt";

interface SettingsFormProps {
  onClose: () => void;
}

interface Settings {
  fireCrawlApiKey: string;
  anthropicApiKey: string;
  openaiApiKey: string;
  maxChunkSize: number;
  chunkOverlap: number;
  maxContextDocuments: number;
  supabaseUrl: string;
  supabasePrivateKey: string;
  googleGenAIApiKey: string;
  systemPrompt: string;
  ollamaApiUrl: string;
  ollamaEmbeddingsModel: string;
  ollamaLLMModel: string;
}

const DEFAULT_SETTINGS: Settings = {
  fireCrawlApiKey: "",
  anthropicApiKey: "",
  openaiApiKey: "",
  maxChunkSize: 250,
  chunkOverlap: 150,
  supabaseUrl: "",
  supabasePrivateKey: "",
  maxContextDocuments: 100,
  googleGenAIApiKey: "",
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  ollamaApiUrl: "http://localhost:11434",
  ollamaEmbeddingsModel: "snowflake-arctic-embed:335m", // 1024 dim
  ollamaLLMModel: "llama3.1:8b",
};

const SettingsForm: React.FC<SettingsFormProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    // Load saved settings when component mounts
    chrome.storage.sync.get(
      [
        "fireCrawlApiKey",
        "anthropicApiKey",
        "openaiApiKey",
        "maxChunkSize",
        "chunkOverlap",
        "supabaseUrl",
        "supabasePrivateKey",
        "maxContextDocuments",
        "googleGenAIApiKey",
        "systemPrompt",
        "ollamaApiUrl",
        "ollamaEmbeddingsModel",
        "ollamaLLMModel",
      ],
      (result) => {
        setSettings({
          fireCrawlApiKey:
            result.fireCrawlApiKey || DEFAULT_SETTINGS.fireCrawlApiKey,
          anthropicApiKey:
            result.anthropicApiKey || DEFAULT_SETTINGS.anthropicApiKey,
          openaiApiKey: result.openaiApiKey || DEFAULT_SETTINGS.openaiApiKey,
          maxChunkSize: result.maxChunkSize || DEFAULT_SETTINGS.maxChunkSize,
          chunkOverlap: result.chunkOverlap || DEFAULT_SETTINGS.chunkOverlap,
          supabaseUrl: result.supabaseUrl || DEFAULT_SETTINGS.supabaseUrl,
          supabasePrivateKey:
            result.supabasePrivateKey || DEFAULT_SETTINGS.supabasePrivateKey,
          maxContextDocuments:
            result.maxContextDocuments || DEFAULT_SETTINGS.maxContextDocuments,
          googleGenAIApiKey:
            result.googleGenAIApiKey || DEFAULT_SETTINGS.googleGenAIApiKey,
          systemPrompt: result.systemPrompt || DEFAULT_SYSTEM_PROMPT,
          ollamaApiUrl: result.ollamaApiUrl || DEFAULT_SETTINGS.ollamaApiUrl,
          ollamaEmbeddingsModel:
            result.ollamaEmbeddingsModel ||
            DEFAULT_SETTINGS.ollamaEmbeddingsModel,
          ollamaLLMModel:
            result.ollamaLLMModel || DEFAULT_SETTINGS.ollamaLLMModel,
        });
      },
    );
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings.systemPrompt.includes("{relevantDocs}")) {
      alert("Please include {relevantDocs} in your system prompt");
      return;
    }
    chrome.storage.sync.set(settings, () => {
      onClose();
    });
  };

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: ["maxChunkSize", "chunkOverlap", "maxContextDocuments"].includes(
        name,
      )
        ? parseInt(value)
        : value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-lg font-semibold">LLM API Keys</p>

      <div className="w-full">
        <Label>OpenAI API Key</Label>
        <Input
          type="text"
          name="openaiApiKey"
          value={settings.openaiApiKey}
          onChange={handleChange}
          className="w-full"
        />
      </div>

      <div className="flex justify-between w-full gap-2">
        <div className="w-full">
          <Label>Google GenAI API Key</Label>
          <Input
            type="text"
            name="googleGenAIApiKey"
            value={settings.googleGenAIApiKey}
            onChange={handleChange}
            className="w-full"
          />
        </div>

        <div className="w-full">
          <Label>Anthropic API Key</Label>
          <Input
            type="text"
            name="anthropicApiKey"
            value={settings.anthropicApiKey}
            onChange={handleChange}
            className="w-full"
          />
        </div>
      </div>

      <hr />
      <p className="text-lg font-semibold">VectorStore Configuration</p>

      <div className="flex justify-between w-full gap-2">
        <div className="w-full">
          <Label>Supabase URL</Label>
          <Input
            type="text"
            name="supabaseUrl"
            value={settings.supabaseUrl}
            onChange={handleChange}
            className="w-full"
          />
        </div>
        <div className="w-full">
          <Label>Supabase Private Key</Label>
          <Input
            type="text"
            name="supabasePrivateKey"
            value={settings.supabasePrivateKey}
            onChange={handleChange}
            className="w-full"
          />
        </div>
      </div>

      <hr />
      <p className="text-lg font-semibold">Local Ollama Configuration</p>

      <div className="flex justify-between w-full gap-2">
        <div className="w-full">
          <Label>Ollama API URL</Label>
          <Input
            type="text"
            name="ollamaApiUrl"
            value={settings.ollamaApiUrl}
            onChange={handleChange}
            className="w-full"
          />
        </div>
        <div className="w-full">
          <Label>Ollama Embeddings Model</Label>
          <Input
            type="text"
            name="ollamaEmbeddingsModel"
            value={settings.ollamaEmbeddingsModel}
            onChange={handleChange}
            className="w-full"
          />
        </div>
      </div>

      <hr />
      <p className="text-lg font-semibold">Web Scraper Configuration</p>

      <div>
        <Label>FireCrawl API Key</Label>
        <Input
          type="text"
          name="fireCrawlApiKey"
          value={settings.fireCrawlApiKey}
          onChange={handleChange}
        />
      </div>

      <div className="flex justify-between w-full gap-2">
        <div className="w-full">
          <Label>Max Chunk Size</Label>
          <Input
            type="number"
            name="maxChunkSize"
            value={settings.maxChunkSize}
            onChange={handleChange}
            className="w-full"
          />
        </div>
        <div className="w-full">
          <Label>Chunk Overlap</Label>
          <Input
            type="number"
            name="chunkOverlap"
            value={settings.chunkOverlap}
            onChange={handleChange}
            className="w-full"
          />
        </div>
      </div>

      <hr />
      <p className="text-lg font-semibold">Generation Configuration</p>

      <div>
        <Label>Max Context Documents</Label>
        <Input
          type="number"
          name="maxContextDocuments"
          value={settings.maxContextDocuments}
          onChange={handleChange}
        />
      </div>

      <div className="w-full">
        <Label>System Prompt</Label>
        <p className="text-sm text-gray-600 w-full flex items-center justify-start gap-[2px]">
          Must include <pre className="text-xs">{`{relevantDocs}`}</pre> for
          context.
        </p>
        <Textarea
          name="systemPrompt"
          value={settings.systemPrompt}
          onChange={handleChange}
          rows={6}
          className="w-full"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" onClick={onClose} variant="secondary">
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
};

export default SettingsForm;

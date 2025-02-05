import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Settings, SquarePen } from "lucide-react";
import SettingsForm from "./components/SettingsForm";
import Index from "./components/index-site/index";
import { Button } from "./components/ui/button";
import { RuntimeProvider } from "./runtimes/assistant-ui";
import ChatView from "./components/ChatView";
import ModelSelector from "./components/model-selector";
import { ALL_MODEL_NAMES } from "./constants";
import { TooltipIconButton } from "./components/assistant-ui/tooltip-icon-button";
import { useAssistantRuntime } from "@assistant-ui/react";

function Header({
  model,
  setModel,
  toggleSettings,
  setSessionId,
}: {
  model: ALL_MODEL_NAMES;
  setModel: (model: ALL_MODEL_NAMES) => void;
  toggleSettings: () => void;
  setSessionId: React.Dispatch<React.SetStateAction<string>>;
}) {
  const assistantRuntime = useAssistantRuntime();

  const handleNewChat = () => {
    setSessionId(uuidv4());
    assistantRuntime.switchToNewThread();
    // assistantRuntime.threads.delete(assistantRuntime.threads.getState().mainThreadId);
  };

  return (
    <div className="flex items-center justify-between mb-4">
      <p className="text-2xl font-semibold text-black tracking-tighter">
        Site<span className="font-extrabold text-red-600">RAG</span>
      </p>
      <div className="flex items-center gap-2">
        <ModelSelector modelName={model} setModelName={setModel} />
        <Button variant="ghost" onClick={toggleSettings}>
          <Settings size={24} />
        </Button>
        <TooltipIconButton
          tooltip="New chat"
          variant="ghost"
          onClick={handleNewChat}
          className="p-2"
        >
          <SquarePen size={24} />
        </TooltipIconButton>
      </div>
    </div>
  );
}

const App: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  const [queryMode, setQueryMode] = useState<"page" | "site">("page");
  const [model, setModel] = useState<ALL_MODEL_NAMES>("gpt-4o");
  const [retrievalMode, setRetrievalMode] = useState<"base" | "multi">("base");
  const [contextStuff, setContextStuff] = useState(true);
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      const url = tabs[0]?.url || "";
      setCurrentUrl(url);
    });
  }, []);

  useEffect(() => {
    if (!currentUrl) return;
    setSessionId(uuidv4());
  }, [currentUrl]);

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  return (
    <RuntimeProvider
      currentUrl={currentUrl}
      queryMode={queryMode}
      model={model}
      retrievalMode={retrievalMode}
      contextStuff={contextStuff}
      sessionId={sessionId}
    >
      <div className="w-[700px] h-[600px] rounded-3xl p-4 bg-white">
        <Header
          model={model}
          setModel={setModel}
          toggleSettings={toggleSettings}
          setSessionId={setSessionId}
        />

        <div className="mb-3">
          <Index currentUrl={currentUrl} />
        </div>

        {showSettings ? (
          <SettingsForm onClose={() => setShowSettings(false)} />
        ) : (
          <ChatView
            queryMode={queryMode}
            setQueryMode={setQueryMode}
            retrievalMode={retrievalMode}
            setRetrievalMode={setRetrievalMode}
            contextStuff={contextStuff}
            setContextStuff={setContextStuff}
          />
        )}
      </div>
    </RuntimeProvider>
  );
};

export default App;

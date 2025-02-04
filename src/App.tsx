import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Settings } from "lucide-react";
import SettingsForm from "./components/SettingsForm";
import Index from "./components/index-site/index";
import { Button } from "./components/ui/button";
import { RuntimeProvider } from "./runtimes/assistant-ui";
import ChatView from "./components/ChatView";
import { Model } from "./types";
import ModelSelect from "./components/ModelSelect";

const App: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  const [queryMode, setQueryMode] = useState<"page" | "site">("page");
  const [model, setModel] = useState<Model>("gpt-4o");
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
        <div className="flex items-center justify-between mb-4">
          <p className="text-2xl font-semibold text-black tracking-tighter">
            Site<span className="font-extrabold text-red-600">RAG</span>
          </p>
          <div className="flex items-center gap-2">
            <ModelSelect model={model} setModel={setModel} />
            <Button variant="ghost" onClick={toggleSettings}>
              <Settings size={24} />
            </Button>
          </div>
        </div>

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

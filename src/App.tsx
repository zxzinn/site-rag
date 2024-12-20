import React, { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import SettingsForm from "./components/SettingsForm";
import Index from "./components/Index";
import { Button } from "./components/ui/button";
import { RuntimeProvider } from "./runtimes/assistant-ui";
import ChatView from "./components/ChatView";

const App: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [queryMode, setQueryMode] = useState<"page" | "site">("page");

  useEffect(() => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      const url = tabs[0]?.url || "";
      setCurrentUrl(url);
    });
  }, []);

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  return (
    <RuntimeProvider queryMode={queryMode}>
      <div className="w-[600px] h-[600px] p-4 bg-white">
        <div className="flex items-center justify-between mb-4">
          <Index currentUrl={currentUrl} />
          <Button variant="ghost" onClick={toggleSettings}>
            <Settings size={24} />
          </Button>
        </div>

        {showSettings ? (
          <SettingsForm onClose={() => setShowSettings(false)} />
        ) : (
          <ChatView queryMode={queryMode} setQueryMode={setQueryMode} />
        )}
      </div>
    </RuntimeProvider>
  );
};

export default App;

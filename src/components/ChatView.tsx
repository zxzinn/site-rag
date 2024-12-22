import React from "react";
import { Thread } from "./assistant-ui/thread";

export default function ChatView({
  queryMode,
  setQueryMode,
}: {
  queryMode: "page" | "site";
  setQueryMode: React.Dispatch<React.SetStateAction<"page" | "site">>;
}) {
  return (
    <div className="w-full mt-auto h-full max-h-[465px] overflow-y-auto">
      <Thread queryMode={queryMode} setQueryMode={setQueryMode} />
    </div>
  );
}

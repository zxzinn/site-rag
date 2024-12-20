import React from "react";
import { Thread } from "./assistant-ui/thread";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

export default function ChatView({
  queryMode,
  setQueryMode,
}: {
  queryMode: "page" | "site";
  setQueryMode: React.Dispatch<React.SetStateAction<"page" | "site">>;
}) {
  return (
    <div className="w-full mt-auto overflow-y-auto">
      <div className="flex items-center space-x-2">
        <Switch
          checked={queryMode === "site"}
          onCheckedChange={(checked) => setQueryMode(checked ? "site" : "page")}
          id="query-mode"
        />
        <Label htmlFor="query-mode">Query Site</Label>
      </div>
      <span className="text-muted-foreground max-w-1/2 text-pretty">
        Only if you've already indexed the entire site. Defaults to querying the
        current page.
      </span>
      <Thread />
    </div>
  );
}

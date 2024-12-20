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
      <div className="text-muted-foreground w-2/3 text-pretty">
        Filters indexed documents by base URL. If unchecked, will filter by
        current page URL.
      </div>
      <Thread />
    </div>
  );
}

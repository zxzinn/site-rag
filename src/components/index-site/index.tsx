import { useEffect, useState } from "react";
import { format } from "date-fns";
import { getLastIndexed } from "@/lib/last-indexed";
import { indexData } from "@/graphs/_index";
import {
  IndexPageConfirmDialog,
  IndexSiteConfirmDialog,
} from "./IndexConfirmDialog";

interface IngestProps {
  currentUrl: string;
}

export default function Index({ currentUrl }: IngestProps) {
  const [loading, setLoading] = useState(false);
  const [lastIndexed, setLastIndexed] = useState<string>("");
  const [numberDocsIndexed, setNumberDocsIndexed] = useState<number>();

  useEffect(() => {
    if (!currentUrl) return;
    getLastIndexed(currentUrl).then(setLastIndexed);
  }, [currentUrl]);

  const handleIndex = async (
    mode: "scrape" | "crawl",
    options?: { allowBackwardLinks?: boolean; clearExisting?: boolean },
  ) => {
    setLoading(true);
    try {
      const { docs } = await indexData({
        url: currentUrl,
        mode,
        allowBackwardLinks: options?.allowBackwardLinks || false,
        clearExisting: options?.clearExisting || false,
      });
      setNumberDocsIndexed(docs.length);
    } catch (error) {
      console.error("Error ingesting data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-row gap-2 justify-between">
      <div className="flex flex-col gap-1 max-w-[300px]">
        {currentUrl ? (
          <p className="text-wrap break-words">
            <span className="text-gray-600">Current URL:</span> {currentUrl}
          </p>
        ) : (
          <p>No active tab</p>
        )}
        {lastIndexed && numberDocsIndexed == null && (
          <p>
            <span className="text-gray-600">Last indexed:</span>{" "}
            {format(new Date(lastIndexed), "MM/dd/yy HH:mm")}
          </p>
        )}
        {!lastIndexed && numberDocsIndexed == null && <p>Site not indexed.</p>}
        {numberDocsIndexed != null && (
          <p>Indexed {numberDocsIndexed} documents.</p>
        )}
      </div>

      <div className="flex gap-1">
        <IndexPageConfirmDialog disabled={loading} handleSubmit={handleIndex} />
        <IndexSiteConfirmDialog disabled={loading} handleSubmit={handleIndex} />
      </div>
    </div>
  );
}

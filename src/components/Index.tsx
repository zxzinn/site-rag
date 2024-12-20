import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { format } from "date-fns";
import { getLastIndexed } from "@/lib/last-indexed";
import { indexData } from "@/graphs/index";

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

  const handleIndex = async (mode: "scrape" | "crawl") => {
    setLoading(true);
    try {
      const { docs } = await indexData({ url: currentUrl, mode });
      setNumberDocsIndexed(docs.length);
    } catch (error) {
      console.error("Error ingesting data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 items-start">
      {currentUrl ? (
        <p>
          <span className="text-gray-600">Current URL:</span> {currentUrl}
        </p>
      ) : (
        <p>No active tab</p>
      )}
      {lastIndexed ? (
        <p>
          <span className="text-gray-600">Last indexed:</span>{" "}
          {format(new Date(lastIndexed), "MM/dd/yy HH:mm")}
        </p>
      ) : (
        <p>Site not indexed.</p>
      )}
      <div className="flex w-full gap-2 items-start">
        <Button disabled={loading} onClick={() => handleIndex("scrape")}>
          Index Page
        </Button>
        <Button disabled={loading} onClick={() => handleIndex("crawl")}>
          Index Site
        </Button>
      </div>
      {numberDocsIndexed != null && (
        <p>Indexed {numberDocsIndexed} documents.</p>
      )}
    </div>
  );
}

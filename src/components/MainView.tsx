import React, { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { queryModel } from "@/graphs/query";

const MainView: React.FC<{ currentUrl: string }> = ({ currentUrl }) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const stream = await queryModel({ query, currentUrl });
      for await (const chunk of stream) {
        setResult((prev) => {
          return prev + chunk.content;
        });
      }
    } catch (error) {
      console.error("Error running graph:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 items-start">
      <form onSubmit={handleSubmit} className="space-y-4 w-full">
        <div>
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={4}
            placeholder="Ask me anything"
            className="w-full"
          />
        </div>
        <div className="flex justify-start">
          <Button type="submit" disabled={loading || !query.trim()}>
            {loading ? "Processing..." : "Submit"}
          </Button>
        </div>
      </form>

      <div className="w-full flex flex-col items-start">
        <p className="text-base text-gray-600">Result</p>
        <p>{result}</p>
      </div>
    </div>
  );
};

export default MainView;

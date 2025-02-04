import { type ReactNode } from "react";
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
} from "@assistant-ui/react";
import { Model } from "@/types";
import { queryModel } from "@/graphs/query/index";

const ModelAdapter = (args: Record<string, any>): ChatModelAdapter => {
  return {
    async *run({ messages, abortSignal }) {
      const stream = await queryModel({
        messages,
        abortSignal,
        currentUrl: args.currentUrl,
        queryMode: args.queryMode,
        model: args.model,
        retrievalMode: args.retrievalMode,
        contextStuff: args.contextStuff,
        sessionId: args.sessionId,
      });

      let text = "";
      for await (const part of stream) {
        text += part.content;
        yield {
          content: [{ type: "text", text }],
        };
      }
    },
  };
};

export function RuntimeProvider({
  children,
  currentUrl,
  queryMode,
  model,
  retrievalMode,
  contextStuff,
  sessionId,
}: Readonly<{
  children: ReactNode;
  currentUrl: string;
  queryMode: "page" | "site";
  model: Model;
  retrievalMode: "base" | "multi";
  contextStuff: boolean;
  sessionId: string;
}>) {
  const runtime = useLocalRuntime(
    ModelAdapter({
      currentUrl,
      queryMode,
      model,
      retrievalMode,
      contextStuff,
      sessionId,
    }),
  );

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}

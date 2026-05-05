export type LlmProvider = "openai" | "anthropic" | "groq";

export type LlmCall = {
  provider: LlmProvider;
  model: string;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json_object";
};

export type LlmResponse = {
  text: string;
  usage?: { promptTokens: number; completionTokens: number };
};

export type LlmRouter = {
  call: (req: LlmCall) => Promise<LlmResponse>;
};

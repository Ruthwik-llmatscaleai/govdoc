import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface Citation {
  documentName: string;
  citedText: string;
  startIndex?: number;
  endIndex?: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  /** Document names consulted to answer the question. Only `documentName` is
   *  rendered by the UI; older code stored stub fields here too — they were
   *  never used and have been dropped. */
  sources?: Array<{ documentName: string }>;
  timestamp: string;
}

const SYSTEM_GROUNDED =
  "You are a helpful assistant that answers questions based on the provided documents. Only answer based on the information in the documents. If the answer is not in the documents, say so clearly. Be concise and accurate. Always cite specific passages from the documents to support your answers.";

const SYSTEM_GENERAL =
  "You are GovDoc's assistant — a knowledgeable, concise AI helper for state and local government work. When the user has not attached any documents, answer from your own knowledge. Use Markdown for structure when it helps clarity. If you are unsure, say so plainly.";

export async function answerQuestion(
  question: string,
  fileIds: Array<{ fileId: string; fileName: string }>,
  chatHistory: ChatMessage[] = [],
): Promise<ChatMessage> {
  const hasDocs = fileIds.length > 0;

  const documentBlocks: Anthropic.Beta.BetaContentBlockParam[] = fileIds.map((f) => ({
    type: "document" as const,
    source: { type: "file" as const, file_id: f.fileId },
    title: f.fileName,
    citations: { enabled: true },
  }));

  const userContent: Anthropic.Beta.BetaContentBlockParam[] = [
    ...documentBlocks,
    { type: "text" as const, text: question },
  ];

  const messages: Anthropic.Beta.BetaMessageParam[] = [
    ...chatHistory.slice(-10).map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user" as const, content: userContent },
  ];

  const response = await anthropic.beta.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 16000,
    betas: ["files-api-2025-04-14"],
    thinking: {
      type: "adaptive",
      display: "omitted",
    },
    system: hasDocs ? SYSTEM_GROUNDED : SYSTEM_GENERAL,
    messages,
  });

  const fileIdToName = Object.fromEntries(fileIds.map((f) => [f.fileId, f.fileName]));
  let answerText = "";
  const citations: Citation[] = [];

  for (const block of response.content) {
    if (block.type === "text") {
      answerText += block.text;
      const blockAny = block as unknown as Record<string, unknown>;
      if ("citations" in block && Array.isArray(blockAny.citations)) {
        for (const cite of blockAny.citations as Array<Record<string, unknown>>) {
          const citedText = cite.cited_text as string | undefined;
          if (!citedText) continue;
          const docName =
            (cite.document_title as string) ||
            fileIdToName[cite.file_id as string] ||
            "Document";
          citations.push({
            documentName: docName,
            citedText,
            startIndex: cite.start_char_index as number | undefined,
            endIndex: cite.end_char_index as number | undefined,
          });
        }
      }
    }
  }

  const uniqueCitations = citations.filter(
    (cite, i, arr) => arr.findIndex((c) => c.citedText === cite.citedText) === i,
  );

  return {
    role: "assistant",
    content: answerText,
    citations: uniqueCitations.length > 0 ? uniqueCitations : undefined,
    sources: hasDocs ? fileIds.map((f) => ({ documentName: f.fileName })) : undefined,
    timestamp: new Date().toISOString(),
  };
}

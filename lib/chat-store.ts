import { prisma } from "@/lib/db";

export interface ChatMessageRecord {
  userId: string;
  messageId: string;
  role: "user" | "assistant";
  content: string;
  sources?: unknown;
  timestamp: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  lastMessageAt: string | null;
  isPinned: boolean;
}

export async function createConversation(
  userId: string,
  title = "New Conversation",
): Promise<string> {
  const conv = await prisma.conversation.create({
    data: { userId, title },
  });
  return conv.id;
}

export async function listConversations(
  userId: string,
  limit = 50,
): Promise<ConversationSummary[]> {
  const convs = await prisma.conversation.findMany({
    where: { userId, deletedAt: null },
    orderBy: { lastMessageAt: { sort: "desc", nulls: "last" } },
    take: limit,
  });
  return convs.map((c) => ({
    id: c.id,
    title: c.title,
    createdAt: c.createdAt.toISOString(),
    lastMessageAt: c.lastMessageAt?.toISOString() ?? null,
    isPinned: c.isPinned,
  }));
}

export async function getConversationMessages(
  conversationId: string,
  userId: string,
  limit = 200,
): Promise<ChatMessageRecord[]> {
  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, userId, deletedAt: null },
  });
  if (!conv) return [];

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
  return messages.map((m) => ({
    userId,
    messageId: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
    sources: m.sources ?? undefined,
    timestamp: m.createdAt.toISOString(),
  }));
}

export async function saveChatMessage(
  userId: string,
  msg: { role: "user" | "assistant"; content: string; sources?: unknown },
  conversationId?: string,
): Promise<{ conversationId: string }> {
  // Always create a new conversation if none specified
  const convId = conversationId ?? await createConversation(userId, msg.content.slice(0, 80) || "New Conversation");

  await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: convId,
        role: msg.role,
        content: msg.content,
        sources: (msg.sources as object) ?? undefined,
      },
    }),
    prisma.conversation.update({
      where: { id: convId },
      data: { lastMessageAt: new Date() },
    }),
  ]);

  return { conversationId: convId };
}

export async function updateConversationTitle(
  conversationId: string,
  userId: string,
  title: string,
): Promise<void> {
  await prisma.conversation.updateMany({
    where: { id: conversationId, userId, deletedAt: null },
    data: { title: title.slice(0, 200) },
  });
}

export async function deleteConversation(
  conversationId: string,
  userId: string,
): Promise<void> {
  await prisma.conversation.updateMany({
    where: { id: conversationId, userId },
    data: { deletedAt: new Date() },
  });
}

export async function clearUserChat(userId: string): Promise<void> {
  await prisma.conversation.deleteMany({ where: { userId } });
}

// Legacy compat: load all messages across conversations (flat)
export async function loadChatHistory(userId: string, limit = 200): Promise<ChatMessageRecord[]> {
  const messages = await prisma.message.findMany({
    where: { conversation: { userId, deletedAt: null } },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
  return messages.map((m) => ({
    userId,
    messageId: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
    sources: m.sources ?? undefined,
    timestamp: m.createdAt.toISOString(),
  }));
}

async function getOrCreateDefaultConversation(userId: string): Promise<string> {
  const existing = await prisma.conversation.findFirst({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing.id;
  const created = await prisma.conversation.create({
    data: { userId, title: "New Conversation" },
  });
  return created.id;
}

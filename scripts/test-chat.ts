/**
 * Basic chat API integration test.
 * Usage: npx tsx scripts/test-chat.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const PORTS = [3000, 3002, 3003];
const prisma = new PrismaClient();

async function detectPort(): Promise<number> {
  for (const port of PORTS) {
    try {
      const res = await fetch(`http://localhost:${port}/api/health`, {
        signal: AbortSignal.timeout(2000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (data?.success) return port;
    } catch {
      // try next
    }
  }
  throw new Error("No running dev server found");
}

function extractCookies(response: Response): string {
  const getSetCookie = (
    response.headers as Headers & { getSetCookie?: () => string[] }
  ).getSetCookie?.();
  if (getSetCookie?.length) {
    return getSetCookie.map((c) => c.split(";")[0]?.trim()).join("; ");
  }
  const single = response.headers.get("set-cookie");
  if (!single) return "";
  return single
    .split(/,(?=\s*\w+=)/)
    .map((c) => c.split(";")[0]?.trim())
    .filter(Boolean)
    .join("; ");
}

async function login(
  base: string,
  email: string,
  password: string,
): Promise<string> {
  const res = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, rememberMe: true }),
  });
  const cookie = extractCookies(res);
  if (!res.ok || !cookie) throw new Error(`Login failed for ${email}`);
  return cookie;
}

async function api<T>(
  base: string,
  path: string,
  cookie: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
      ...init?.headers,
    },
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? `Request failed: ${path}`);
  }
  return data.data as T;
}

async function ensureChatFixture() {
  const email = "chat.tester@spark.test";
  const password = "Test1234!";
  const hash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { isActive: true },
    create: {
      name: "Chat Tester",
      email,
      password: hash,
      profileCompleted: true,
      isActive: true,
    },
  });

  const partner = await prisma.user.findFirst({
    where: { email: "alex.demo@spark.test" },
  });
  if (!partner) throw new Error("Run npm run db:seed:social first");

  const [user1Id, user2Id] =
    user.id < partner.id ? [user.id, partner.id] : [partner.id, user.id];

  const existing = await prisma.conversation.findFirst({
    where: {
      participants: {
        every: { userId: { in: [user1Id, user2Id] } },
      },
    },
    include: { participants: true },
  });

  const conversation =
    existing ??
    (await prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId: user1Id }, { userId: user2Id }],
        },
      },
    }));

  return { email, password, conversationId: conversation.id };
}

async function main() {
  const port = await detectPort();
  const base = `http://localhost:${port}`;
  console.log(`Using ${base}`);

  const { email, password, conversationId } = await ensureChatFixture();
  const cookie = await login(base, email, password);

  const conversations = await api<{
    items: { id: string }[];
  }>(base, "/api/conversations?limit=5", cookie);
  console.log(`Conversations: ${conversations.items.length}`);

  const detail = await api<{ conversation: { id: string } }>(
    base,
    `/api/conversations/${conversationId}`,
    cookie,
  );
  console.log("Conversation detail OK:", detail.conversation.id);

  const sent = await api<{ message: { id: string } }>(base, "/api/messages", cookie, {
    method: "POST",
    body: JSON.stringify({
      conversationId,
      type: "TEXT",
      text: `Test message ${Date.now()}`,
    }),
  });
  console.log("Message sent:", sent.message.id);

  const messages = await api<{ items: { id: string }[] }>(
    base,
    `/api/messages?conversationId=${conversationId}&limit=10`,
    cookie,
  );
  console.log(`Messages loaded: ${messages.items.length}`);

  const forbidden = await fetch(
    `${base}/api/conversations/${conversationId}`,
    { headers: { Cookie: "spark_access_token=invalid" } },
  );
  console.log("Unauthorized blocked:", forbidden.status === 401);

  console.log("Chat API tests passed.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

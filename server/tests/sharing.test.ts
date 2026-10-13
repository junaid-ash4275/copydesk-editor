import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { createApp } from "../src/app.js";
import { hashPassword } from "../src/lib/passwords.js";
import { emptyDoc, serializeDoc } from "../src/lib/tiptap.js";

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const prisma = new PrismaClient();
const app = createApp();

const password = "demo1234";

async function login(email: string) {
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/login").send({ email, password });
  expect(res.status).toBe(200);
  return agent;
}

describe("document sharing", () => {
  let alexId = "";
  let caseyId = "";
  let documentId = "";

  beforeAll(async () => {
    execSync("npx prisma db push --skip-generate --accept-data-loss", {
      cwd: serverRoot,
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: "file:./test.db" },
    });
    await prisma.share.deleteMany();
    await prisma.session.deleteMany();
    await prisma.document.deleteMany();
    await prisma.user.deleteMany();

    const passwordHash = await hashPassword(password);
    const alex = await prisma.user.create({
      data: { email: "alex@ajaia.dev", name: "Alex Okonkwo", passwordHash },
    });
    const blair = await prisma.user.create({
      data: { email: "blair@ajaia.dev", name: "Blair Chen", passwordHash },
    });
    const casey = await prisma.user.create({
      data: { email: "casey@ajaia.dev", name: "Casey Romero", passwordHash },
    });
    alexId = alex.id;
    caseyId = casey.id;

    const doc = await prisma.document.create({
      data: {
        title: "Private draft",
        content: serializeDoc(emptyDoc()),
        ownerId: alexId,
      },
    });
    documentId = doc.id;
    void blair;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("lets an owner share a document and denies everyone else", async () => {
    const alex = await login("alex@ajaia.dev");
    const share = await alex.post(`/api/documents/${documentId}/share`).send({
      email: "blair@ajaia.dev",
    });
    expect(share.status).toBe(200);
    expect(share.body.collaborators.map((c: { email: string }) => c.email)).toContain(
      "blair@ajaia.dev",
    );

    const blair = await login("blair@ajaia.dev");
    const asBlair = await blair.get(`/api/documents/${documentId}`);
    expect(asBlair.status).toBe(200);
    expect(asBlair.body.role).toBe("shared");

    const casey = await login("casey@ajaia.dev");
    const asCasey = await casey.get(`/api/documents/${documentId}`);
    expect(asCasey.status).toBe(403);

    const list = await blair.get("/api/documents");
    expect(list.body.shared.some((d: { id: string }) => d.id === documentId)).toBe(true);
    expect(list.body.owned.some((d: { id: string }) => d.id === documentId)).toBe(false);

    void caseyId;
  });

  it("creates a missing document when autosave patches it", async () => {
    const alex = await login("alex@ajaia.dev");
    const missingId = "cmaterializeautosave0001";
    const res = await alex.patch(`/api/documents/${missingId}`).send({
      title: "Brand new draft",
      content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "hello" }] }] },
    });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Brand new draft");
    const got = await alex.get(`/api/documents/${missingId}`);
    expect(got.status).toBe(200);
    expect(got.body.title).toBe("Brand new draft");
  });

  it("restores a version from the request snapshot when the row is gone", async () => {
    const alex = await login("alex@ajaia.dev");
    const saved = await alex.post(`/api/documents/${documentId}/versions`).send({
      title: "checkpoint",
      content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "snap" }] }] },
    });
    expect(saved.status).toBe(201);
    const version = saved.body.versions[0];
    await prisma.documentVersion.delete({ where: { id: version.id } });
    const restored = await alex.post(`/api/documents/${documentId}/versions/${version.id}/restore`).send({
      title: version.title,
      content: version.content,
    });
    expect(restored.status).toBe(200);
    expect(restored.body.title).toBe("checkpoint");
  });

  it("snapshots the title sent with save version", async () => {
    const alex = await login("alex@ajaia.dev");
    const saved = await alex.post(`/api/documents/${documentId}/versions`).send({
      title: "Hiring loop checklist pre-release",
    });
    expect(saved.status).toBe(201);
    expect(saved.body.versions[0].title).toBe("Hiring loop checklist pre-release");
  });

  it("still authenticates after the session row is gone", async () => {
    const alex = await login("alex@ajaia.dev");
    await prisma.session.deleteMany();
    const saved = await alex.post(`/api/documents/${documentId}/versions`);
    expect(saved.status).toBe(201);
    expect(saved.body.versions.length).toBeGreaterThan(0);
  });
});

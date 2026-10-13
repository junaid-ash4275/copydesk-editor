import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/passwords.js";
import { markdownToTiptap, serializeDoc } from "../src/lib/tiptap.js";

const prisma = new PrismaClient();

const seedMarkdown = `# Product review notes

This is a working draft for **internal review**. Keep language precise; this document is shared with the design lead.

## What shipped

- Document create, rename, and autosave
- Rich text with headings and lists
- Import from Markdown

## Open questions

1. Should shared editors be allowed to rename?
2. Do we want a view-only role in the next pass?

_Last updated on Copydesk._
`;

async function main() {
  await prisma.share.deleteMany();
  await prisma.session.deleteMany();
  await prisma.document.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hashPassword("demo1234");

  const alex = await prisma.user.create({
    data: { email: "alex@ajaia.dev", name: "Alex Okonkwo", passwordHash },
  });
  const blair = await prisma.user.create({
    data: { email: "blair@ajaia.dev", name: "Blair Chen", passwordHash },
  });
  await prisma.user.create({
    data: { email: "casey@ajaia.dev", name: "Casey Romero", passwordHash },
  });

  const shared = await prisma.document.create({
    data: {
      title: "Q3 product notes",
      content: serializeDoc(markdownToTiptap(seedMarkdown)),
      ownerId: alex.id,
    },
  });

  await prisma.document.create({
    data: {
      title: "Hiring loop checklist",
      content: serializeDoc(
        markdownToTiptap(`# Hiring loop checklist

Use this before a take-home goes out.

- Confirm timebox is 4–6 hours
- Include seeded accounts in the README
- Record a 3–5 minute walkthrough
`),
      ),
      ownerId: alex.id,
    },
  });

  await prisma.share.create({
    data: { documentId: shared.id, userId: blair.id },
  });

  await prisma.documentVersion.create({
    data: {
      documentId: shared.id,
      title: shared.title,
      content: shared.content,
      createdById: alex.id,
    },
  });

  await prisma.comment.create({
    data: {
      documentId: shared.id,
      authorId: blair.id,
      kind: "suggestion",
      quote: "Do we want a view-only role in the next pass?",
      body: "Make this a decision by Friday. View-only can wait until we have more than three testers.",
    },
  });

  console.log("Seeded alex@ajaia.dev, blair@ajaia.dev, casey@ajaia.dev");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

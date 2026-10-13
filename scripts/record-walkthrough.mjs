import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rawDir = path.join(root, "submission", "raw");
const fixture = path.join(root, "fixtures", "product-notes.md");
const finalWebm = path.join(root, "submission", "Copydesk-walkthrough.webm");

async function caption(page, text) {
  await page.evaluate((next) => {
    let el = document.getElementById("walkthrough-caption");
    if (!el) {
      el = document.createElement("div");
      el.id = "walkthrough-caption";
      Object.assign(el.style, {
        position: "fixed",
        left: "28px",
        right: "28px",
        bottom: "20px",
        zIndex: "2147483647",
        background: "#1c1917",
        color: "#f4efe6",
        padding: "14px 18px",
        borderRadius: "6px",
        font: '500 16px/1.45 "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif',
        boxShadow: "0 10px 30px rgba(28, 25, 23, 0.28)",
        pointerEvents: "none",
      });
      document.body.appendChild(el);
    }
    el.textContent = next;
  }, text);
}

async function say(page, text, ms = 4200) {
  await caption(page, text);
  await page.waitForTimeout(ms + 3800);
}

async function main() {
  fs.rmSync(rawDir, { recursive: true, force: true });
  fs.mkdirSync(rawDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: rawDir, size: { width: 1440, height: 900 } },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const video = page.video();

  await page.goto("http://localhost:5173/login", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await say(
    page,
    "Copydesk — a Google Docs–style desk for internal drafts. Three seeded accounts, one password: demo1234.",
    5000,
  );
  await say(page, "Alex owns the seeded docs. Blair already has Q3 product notes. Casey has no access.", 4500);

  await page.getByRole("button", { name: /Alex Okonkwo/ }).click();
  await page.waitForURL("**/");
  await page.waitForSelector("text=My documents");
  await say(page, "Owned work and shared work stay in separate lists. Alex owns two seeded drafts.", 5000);

  await page.getByRole("button", { name: "New document" }).first().click();
  await page.waitForURL("**/d/**");
  await page.waitForSelector('input[aria-label="Document title"]');
  await say(page, "Create a document, rename it, write, and it autosaves.", 4000);

  const title = page.getByLabel("Document title");
  await title.click();
  await title.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await title.pressSequentially("Reviewer walkthrough notes", { delay: 42 });
  await page.waitForTimeout(400);

  const editor = page.locator(".ProseMirror");
  await editor.click();
  await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await page.keyboard.press("Backspace");
  await page.getByLabel("Paragraph style").selectOption("1");
  await editor.click();
  await page.keyboard.type("What a reviewer should see", { delay: 28 });
  await page.keyboard.press("Enter");
  await page.getByLabel("Paragraph style").selectOption("p");
  await editor.click();
  await page.keyboard.type("Keep the timebox explicit. ", { delay: 24 });
  await page.getByRole("button", { name: "Bold" }).click();
  await page.keyboard.type("Four to six hours.", { delay: 28 });
  await page.getByRole("button", { name: "Bold" }).click();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Bulleted list" }).click();
  await page.keyboard.type("Create, rename, autosave", { delay: 24 });
  await page.keyboard.press("Enter");
  await page.keyboard.type("Share owned vs shared lists", { delay: 24 });
  await page.waitForTimeout(900);
  await say(page, "Autosave writes the live draft. No extra Save button for day-to-day edits.", 4500);
  await page.getByText("Saved", { exact: true }).waitFor({ timeout: 8000 }).catch(() => {});

  await page.getByRole("button", { name: "Share" }).click();
  await page.waitForSelector("text=Share document");
  await say(page, "Only the owner can grant access. Collaborators can edit the body, not rename or reshare.", 4800);
  await page.locator('.field input[type="email"]').fill("blair@ajaia.dev");
  await page.getByRole("button", { name: "Grant access" }).click();
  await page.waitForTimeout(1200);
  await say(page, "Blair can now open this draft from Shared with me.", 4000);
  await page.getByRole("button", { name: "Done" }).click();

  await page.getByRole("link", { name: "Documents" }).first().click();
  await page.waitForURL("**/");
  await say(page, "Import accepts .txt and .md, up to 2 MB, and creates a new document.", 4500);
  await page.locator("input.hidden-file").setInputFiles(fixture);
  await page.waitForURL("**/d/**");
  await page.waitForSelector("text=Design review");
  await say(page, "Markdown headings, emphasis, and lists land in the editor.", 4500);

  await page.getByRole("link", { name: "Q3 product notes" }).first().click();
  await page.waitForSelector('input[aria-label="Document title"]');
  await say(page, "Q3 is already shared with Blair. Presence shows who is on the draft.", 4500);

  await page.locator(".ProseMirror").click();
  await page.evaluate(() => {
    const node = document.querySelector(".ProseMirror p");
    if (!node) return;
    const range = document.createRange();
    range.selectNodeContents(node);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  });
  await page.getByRole("button", { name: "Add comment" }).click();
  await page.getByPlaceholder("Write a comment…").fill("Flag this for Friday so the next reader sees the decision.");
  await page.getByRole("button", { name: "Comment", exact: true }).click();
  await say(page, "Comments are review notes. They stay out of the suggestion list.", 4500);

  await page.locator(".chrome-right").getByRole("button", { name: "Suggest" }).click();
  await page.waitForSelector("text=Suggestions");
  await say(page, "Suggestions are a separate kind. Blair already left one on this seeded draft.", 5000);

  await page.locator(".chrome-right").getByRole("button", { name: "History" }).click();
  await page.waitForSelector("text=Version history");
  await say(page, "Versions are created only when you click Save version — not on every keystroke.", 4500);
  await page.getByRole("button", { name: "Save version" }).click();
  await page.waitForSelector("text=Just now");
  await say(page, "Restore loads that snapshot back into the live document.", 4000);

  await page.getByRole("button", { name: "Export" }).click();
  await say(page, "Export Markdown from the API, or print to PDF from the browser dialog.", 4800);
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: /Alex Okonkwo/ }).click();
  await page.waitForURL("**/login");
  await say(page, "Same desk, different reader. Sign in as Blair.", 4000);
  await page.getByRole("button", { name: /Blair Chen/ }).click();
  await page.waitForURL("**/");
  await page.waitForSelector("text=Shared with me");
  await say(page, "Blair’s owned list is empty. Q3 and the walkthrough notes sit under Shared with me.", 5000);

  await page.getByRole("link", { name: "Q3 product notes" }).first().click();
  await page.waitForSelector("text=Shared");
  await say(page, "Shared badge — Blair can edit the body. The title stays locked to the owner.", 5000);
  await page.locator(".ProseMirror").click();
  await page.keyboard.press("End");
  await page.keyboard.type(" Blair left a line for the next pass.", { delay: 24 });
  await page.waitForTimeout(1200);
  await say(page, "That’s the loop: create, write, share, comment or suggest, checkpoint, hand it on.", 5500);

  await page.waitForTimeout(1200);
  await context.close();
  await browser.close();

  const recorded = video ? await video.path() : fs.readdirSync(rawDir).map((name) => path.join(rawDir, name))[0];
  if (!recorded || !fs.existsSync(recorded)) {
    throw new Error("Playwright did not write a video file.");
  }
  fs.mkdirSync(path.dirname(finalWebm), { recursive: true });
  fs.copyFileSync(recorded, finalWebm);
  const stats = fs.statSync(finalWebm);
  console.log(JSON.stringify({ video: finalWebm, bytes: stats.size }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

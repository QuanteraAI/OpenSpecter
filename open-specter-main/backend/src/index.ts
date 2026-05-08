import "dotenv/config";
import express from "express";
import cors from "cors";
import { chatRouter } from "./routes/chat";
import { projectsRouter } from "./routes/projects";
import { projectChatRouter } from "./routes/projectChat";
import { documentsRouter } from "./routes/documents";
import { tabularRouter } from "./routes/tabular";
import { workflowsRouter } from "./routes/workflows";
import { userRouter } from "./routes/user";
import { downloadsRouter } from "./routes/downloads";
import { activityRouter } from "./routes/activity";
import { legalDataRouter } from "./routes/legalData";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json({ limit: "50mb" }));

app.use("/chat", chatRouter);
app.use("/projects", projectsRouter);
app.use("/projects/:projectId/chat", projectChatRouter);
app.use("/single-documents", documentsRouter);
app.use("/tabular-review", tabularRouter);
app.use("/workflows", workflowsRouter);
app.use("/user", userRouter);
app.use("/users", userRouter);
app.use("/download", downloadsRouter);
app.use("/activity", activityRouter);
app.use("/legal-data", legalDataRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

/**
 * Print a concise integration summary at boot so operators can immediately
 * see which third-party features are wired up.
 *
 * Self-host note: every paid third-party API used here (LegalDataHunter,
 * Gemini, Anthropic, OpenRouter, Resend, Cloudflare R2) requires the operator
 * to provide their *own* credentials. There is no shared/upstream fallback —
 * a missing key disables that feature for this instance only.
 */
function logIntegrationStatus(): void {
  const has = (v?: string) => Boolean(v && v.trim());
  const status = (ok: boolean) => (ok ? "enabled " : "disabled");

  console.log("──────────────────────────────────────────────────────────────");
  console.log("Open Specter — integration status");
  console.log("──────────────────────────────────────────────────────────────");
  console.log(`  Supabase           : ${status(has(process.env.SUPABASE_URL) && has(process.env.SUPABASE_SECRET_KEY))}`);
  console.log(`  Gemini             : ${status(has(process.env.GEMINI_API_KEY))}`);
  console.log(`  Anthropic          : ${status(has(process.env.ANTHROPIC_API_KEY))}`);
  console.log(`  OpenRouter         : ${status(has(process.env.OPENROUTER_API_KEY))}`);
  console.log(`  Resend (email)     : ${status(has(process.env.RESEND_API_KEY))}`);
  console.log(`  Cloudflare R2      : ${status(has(process.env.R2_ENDPOINT_URL) && has(process.env.R2_ACCESS_KEY_ID))}`);
  console.log(`  LegalDataHunter    : ${status(has(process.env.LEGAL_DATA_HUNTER_API_KEY))}`);
  if (!has(process.env.LEGAL_DATA_HUNTER_API_KEY)) {
    console.warn(
      "  ⚠  LEGAL_DATA_HUNTER_API_KEY is not set. The 'Sources' panel and inline\n" +
        "     legal-research citations will be disabled until you add YOUR OWN key\n" +
        "     from https://legaldatahunter.com to backend/.env. This is a paid\n" +
        "     third-party API; usage is billed against the key holder's account.",
    );
  }
  if (!has(process.env.R2_ENDPOINT_URL)) {
    console.warn(
      "  ⚠  Cloudflare R2 is not configured. Document uploads will be written to\n" +
        "     local disk (./data/open-specter-storage). This is fine for development\n" +
        "     but uploads will NOT survive container/pod restarts in production.",
    );
  }
  console.log("──────────────────────────────────────────────────────────────");
}

app.listen(PORT, () => {
  console.log(`Open Specter backend running on port ${PORT}`);
  logIntegrationStatus();
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

// Dev-server plugin: exposes /api/certs/* endpoints so the admin UI can save
// certificate images and data directly to the project (local dev only).
// On the deployed site these endpoints don't exist; the UI shows a fallback notice.
function certAdminPlugin() {
  return {
    name: "cert-admin",
    configureServer(server) {
      const root = process.cwd();
      const certsDir = join(root, "public", "certificates");
      const jsonPath = join(root, "src", "data", "certificates.json");

      function ensureDirs() {
        if (!existsSync(certsDir)) mkdirSync(certsDir, { recursive: true });
        const dataDir = join(root, "src", "data");
        if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
      }

      function readBody(req) {
        return new Promise((resolve, reject) => {
          const chunks = [];
          req.on("data", (c) => chunks.push(c));
          req.on("end", () => resolve(Buffer.concat(chunks).toString()));
          req.on("error", reject);
        });
      }

      function jsonResp(res, data, status = 200) {
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(data));
      }

      // Health check — lets the UI know it's running locally with full API access
      server.middlewares.use("/api/certs/ping", (_req, res) => {
        jsonResp(res, { ok: true, local: true });
      });

      // Save certificates: write base64 images to public/certificates/ and update JSON
      server.middlewares.use("/api/certs/save", async (req, res) => {
        if (req.method !== "POST") return jsonResp(res, { ok: false }, 405);
        try {
          ensureDirs();
          const { certs } = JSON.parse(await readBody(req));

          const saved = certs.map((cert) => {
            const out = {
              id: cert.id,
              name: cert.name || "",
              imagePath: cert.imagePath || "",
              verifyLink: cert.verifyLink || "",
            };
            // If a new base64 image is provided, decode and write it as a file
            if (cert.imageBase64 && cert.imageBase64.startsWith("data:image/")) {
              const m = cert.imageBase64.match(/^data:image\/(\w+);base64,(.+)$/);
              if (m) {
                const ext = m[1] === "jpeg" ? "jpg" : m[1];
                const filename = `${cert.id}.${ext}`;
                writeFileSync(join(certsDir, filename), Buffer.from(m[2], "base64"));
                out.imagePath = `/certificates/${filename}`;
              }
            }
            return out;
          });

          writeFileSync(jsonPath, JSON.stringify(saved, null, 2));
          jsonResp(res, { ok: true, certs: saved });
        } catch (e) {
          jsonResp(res, { ok: false, error: String(e) }, 500);
        }
      });

      // Deploy: git add → commit → push
      server.middlewares.use("/api/certs/deploy", async (req, res) => {
        if (req.method !== "POST") return jsonResp(res, { ok: false }, 405);
        try {
          const raw = await readBody(req);
          const { message = "Update certificate data" } = raw ? JSON.parse(raw) : {};
          try { execSync("git add -A", { cwd: root, stdio: "pipe" }); } catch (_) {}
          try {
            execSync(`git commit -m "${message.replace(/"/g, "'")}"`, { cwd: root, stdio: "pipe" });
          } catch (e) {
            const out = ((e.stdout || "") + (e.stderr || "")).toString();
            if (!out.includes("nothing to commit")) throw e;
          }
          execSync("git push", { cwd: root, stdio: "pipe" });
          jsonResp(res, { ok: true });
        } catch (e) {
          jsonResp(res, { ok: false, error: String(e) }, 500);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), certAdminPlugin()],
  css: {
    postcss: { plugins: [] },
  },
});

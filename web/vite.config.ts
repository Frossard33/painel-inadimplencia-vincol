import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/* Os dados continuam sendo gerados na raiz do repositório (tools/*.py).
   Em desenvolvimento são servidos em /dados/; no build são copiados para dist/dados/.
   Quando o painel passar a ler a API do sistema, só src/dados/carregar.ts muda. */
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARQUIVOS = ["data.js", "data-junsoft.js", "historico.js", "ratings.js"];

function dadosDaRaiz(): Plugin {
  return {
    name: "dados-da-raiz",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const m = req.url?.match(/\/dados\/([\w.-]+\.js)/);
        if (!m || !ARQUIVOS.includes(m[1])) return next();
        res.setHeader("Content-Type", "text/javascript; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        res.end(fs.readFileSync(path.join(RAIZ, m[1])));
      });
    },
    generateBundle() {
      for (const f of ARQUIVOS) {
        this.emitFile({ type: "asset", fileName: "dados/" + f, source: fs.readFileSync(path.join(RAIZ, f)) });
      }
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [react(), dadosDaRaiz()],
  server: { port: 5173, strictPort: true },
});

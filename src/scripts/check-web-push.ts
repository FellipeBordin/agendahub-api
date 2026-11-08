import { getWebPush } from "../config/webPush.js";

try {
  getWebPush();

  console.log("Configuração Web Push válida.");
} catch (error) {
  console.error(
    "Falha na configuração:",
    error instanceof Error ? error.message : "Erro desconhecido.",
  );

  process.exitCode = 1;
}

import express from "express";
import cors from "cors";
import { db } from "./prisma/db.js";
import { serviceRoutes } from "./routes/service.routes.js";
import { appointmentRoutes } from "./routes/appointment.routes.js";
import { availabilityRoutes } from "./routes/availability.routes.js";
import { blockedPeriodRoutes } from "./routes/blockedPeriod.routes.js";
import { authRoutes } from "./routes/auth.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { getPort, validateEnvironment, getCorsOrigins } from "./config/env.js";

validateEnvironment();

const app = express();
const allowedOrigins = getCorsOrigins();

app.use(
  cors({
    origin(origin, callback) {
      const allowed = origin !== undefined && allowedOrigins.includes(origin);

      callback(null, allowed);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Retry-After", "RateLimit", "RateLimit-Policy"],
    credentials: false,
    optionsSuccessStatus: 204,
  }),
);

app.use(express.json({ limit: "100kb" }));
app.use("/api/auth", authRoutes);

app.use("/api/services", serviceRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/blocked-periods", blockedPeriodRoutes);

// Resposta para endereços que não existem.
app.use((_req, res) => {
  return res.status(404).json({
    error: "Rota não encontrada.",
  });
});

app.use(errorHandler);

const port = getPort();

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

let isShuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  console.log(`${signal} recebido. Encerrando a API...`);

  // Evita que o processo fique preso indefinidamente.
  const timeout = setTimeout(() => {
    console.error("O encerramento excedeu 15 segundos. Forçando saída.");
    process.exit(1);
  }, 15_000);

  timeout.unref();

  try {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    console.log("Servidor HTTP encerrado.");

    await db.close();

    console.log("Conexões com o banco encerradas.");
    clearTimeout(timeout);
    process.exitCode = 0;
  } catch (error) {
    console.error("Falha ao encerrar a API:", {
      name: error instanceof Error ? error.name : "UnknownError",
    });

    process.exit(1);
  }
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

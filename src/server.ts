import express from "express";
import cors from "cors";
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

app.use(express.json());
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

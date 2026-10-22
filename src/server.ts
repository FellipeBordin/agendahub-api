import express from "express";
import { serviceRoutes } from "./routes/service.routes.js";
import { appointmentRoutes } from "./routes/appointment.routes.js";
import { availabilityRoutes } from "./routes/availability.routes.js";
import { blockedPeriodRoutes } from "./routes/blockedPeriod.routes.js";
import { authRoutes } from "./routes/auth.routes.js";

const app = express();

app.use(express.json());
app.use("/api/auth", authRoutes);

app.use("/api/services", serviceRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/blocked-periods", blockedPeriodRoutes);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

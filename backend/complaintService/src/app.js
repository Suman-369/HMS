import express from "express";
import cookieParser from "cookie-parser";
import studentComplaintRoutes from "./routes/student.complaint.routes.js";
import staffComplaintRoutes from "./routes/staff.complaint.routes.js";

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "complaint" });
});

app.use("/api/student", studentComplaintRoutes);
app.use("/api/staff", staffComplaintRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  const status = Number.isInteger(err.statusCode) ? err.statusCode : 500;
  res.status(status).json({
    message: status === 500 ? "Internal server error" : err.message,
  });
});

export default app;

import express from "express";
import cookieParser from "cookie-parser";
import studentRoomRoutes from "./routes/student.room.routes.js";
import staffRoomRoutes from "./routes/staff.room.routes.js";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173", // URL of frontend
    credentials: true,
  }),
);
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));
app.use(cookieParser());
app.use("/api/student", studentRoomRoutes);
app.use("/api/staff", staffRoomRoutes);

export default app;

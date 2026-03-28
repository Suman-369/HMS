import express from "express";
import cookieParser from "cookie-parser";
import studentRoomRoutes from "./routes/student.room.routes.js";
import staffRoomRoutes from "./routes/staff.room.routes.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/student", studentRoomRoutes);
app.use("/api/staff", staffRoomRoutes);

export default app;

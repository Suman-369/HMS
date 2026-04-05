import express from 'express';
import cors from 'cors';
import cookies from 'cookie-parser';
import taskRoutes from './routes/task.routes.js';
import reportRoutes from './routes/report.routes.js';

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookies());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'report-task-service' });
});

// API Routes
app.use('/api/report', taskRoutes);
app.use('/api/report/reports', reportRoutes);

// 404 handler - after routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

export default app;


import express from 'express';
import cors from 'cors';
import cookies from 'cookie-parser';
import taskRoutes from './routes/task.routes.js';

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Vite + other services
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

// 404 handler - after routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

export default app;


import express from 'express';
import { 
  getReports, 
  generateReport, 
  uploadReportPdf,
  getAllReports,
  getReportPdf
} from '../controllers/report.controller.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Staff protected
router.get('/', authenticateToken, authorizeRoles('staff'), getReports);
router.post('/generate', authenticateToken, authorizeRoles('staff'), generateReport);
router.post('/:reportId/upload-pdf', authenticateToken, authorizeRoles('staff'), uploadReportPdf);
router.get('/:id/pdf', authenticateToken, getReportPdf);

// Admin protected
router.get('/admin', authenticateToken, authorizeRoles('admin'), getAllReports);

export default router;


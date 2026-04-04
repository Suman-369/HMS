import mongoose from 'mongoose';
import Report from '../models/report.model.js';
import { uploadReportFile } from '../../services/imagekit.service.js';
import Complaint from '../models/complaint.model.js';

// List staff reports
export const getReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, serviceType, year, month } = req.query;
    const query = { generatedBy: req.user.id };
    if (serviceType) query.serviceType = serviceType;
    if (year) query.year = parseInt(year);
    if (month) query.month = parseInt(month);

    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('generatedBy', 'fullname email');

    const total = await Report.countDocuments(query);

    res.json({
      success: true,
      reports,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Generate monthly report
export const generateReport = async (req, res) => {
  try {
    const { serviceType, month, year } = req.body;

    // Check existing
    const existing = await Report.findOne({ serviceType, month, year, generatedBy: req.user.id });
    if (existing) {
      return res.status(409).json({ message: 'Report for this month/service already exists', report: existing });
    }

    // Mock aggregation - TODO: real cross-service query via API or shared DB
    let stats = { total: 0, resolved: 0, pending: 0, avgResolutionDays: 0, trends: [] };
    if (serviceType === 'complaints') {
      // Temp mock from dupe model - replace with real aggregation
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      const pipeline = [
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: {
          _id: '$category',
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } }
        }}
      ];
      const results = await Complaint.aggregate(pipeline);
      stats.total = results.reduce((sum, r) => sum + r.total, 0);
      stats.resolved = results.reduce((sum, r) => sum + r.resolved, 0);
      stats.pending = stats.total - stats.resolved;
      stats.avgResolutionDays = 3.2; // TODO compute
      stats.trends = [{ monthDay: 1, count: 5 }, { monthDay: 15, count: 12 }]; // Mock
    } else {
      // Other services mock
      stats = { total: 45, resolved: 38, pending: 7, avgResolutionDays: 2.8, trends: [] };
    }

    const report = new Report({
      serviceType,
      month: parseInt(month),
      year: parseInt(year),
      stats,
      generatedBy: req.user.id
    });

    await report.save();
    await report.populate('generatedBy', 'fullname.firstName fullname.lastName email');

    res.status(201).json({
      success: true,
      report,
      message: 'Monthly report generated successfully'
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Upload PDF to report
export const uploadReportPdf = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { fileBase64, fileName } = req.body;

    const report = await Report.findOne({ _id: reportId, generatedBy: req.user.id });
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const uploadResult = await uploadReportFile(fileBase64, `${fileName || 'report'}.pdf`, true);

    report.pdfUrl = uploadResult.url;
    await report.save();

    await report.populate('generatedBy', 'fullname.firstName fullname.lastName email');

    res.json({
      success: true,
      report,
      message: 'PDF uploaded successfully to ImageKit',
      pdfUrl: uploadResult.url
    });
  } catch (error) {
    console.error('Upload PDF error:', error);
    res.status(500).json({ message: error.message });
  }
};

// List all reports for admin (no generatedBy filter)
export const getAllReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, serviceType, year, month, staffId } = req.query;
    const query = {};
    if (serviceType) query.serviceType = serviceType;
    if (year) query.year = parseInt(year);
    if (month) query.month = parseInt(month);
    if (staffId) query.generatedBy = staffId;

    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('generatedBy', 'fullname role email');

    const total = await Report.countDocuments(query);

    res.json({
      success: true,
      reports,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Get all reports error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Download PDF report - staff own OR admin
export const getReportPdf = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('=== DEBUG getReportPdf ===');
    console.log('ID:', id);
    console.log('User ID:', req.user?.id);
    console.log('User role:', req.user?.role);
    const report = await Report.findById(id).populate('generatedBy', 'role');
    console.log('Report found:', !!report);
    console.log('Report pdfUrl:', report ? report.pdfUrl : 'null');
    console.log('Report pdfBase64:', !!report?.pdfBase64);
    console.log('Report ID:', report?._id?.toString());
    
    if (!report || !report.pdfUrl) {
      console.log('=== 404 TRIGGERED === No report or no pdfUrl for ID:', id);
      res.status(404);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="report-not-found.pdf"`);
      res.send(Buffer.alloc(0));
      return;
    }
    
    // Auth check
    if (!report.generatedBy || !report.generatedBy._id) {
      return res.status(404).json({ message: 'Invalid report owner' });
    }
  if (report.generatedBy._id.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
    
    // Stream from ImageKit URL
    const https = require('https');
    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const filename = `hostel-report-${report.serviceType}-${monthNames[report.month]}-${report.year}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    https.get(report.pdfUrl, (imgRes) => {
      if (imgRes.statusCode !== 200) {
        console.log('ImageKit fetch failed:', imgRes.statusCode);
        if (!res.headersSent) res.status(404).json({ message: 'PDF not available' });
        return;
      }
      imgRes.pipe(res);
    }).on('error', (err) => {
      console.error('PDF stream error:', err);
      if (!res.headersSent) res.status(500).json({ message: 'Download failed' });
    });
  } catch (error) {
    console.error('Get report PDF error:', error);
    if (!res.headersSent) res.status(500).json({ message: error.message });
  }
};



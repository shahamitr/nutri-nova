import { Hono } from 'hono';
import { authenticateToken } from '../middleware/auth';
import { PDFReportService } from '../services/PDFReportService';
import fs from 'fs';

const app = new Hono();
const pdfService = new PDFReportService();

/**
 * Generate comprehensive health report
 * POST /generate
 */
app.post('/generate', authenticateToken, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const options = body.options || {};

    const { filePath, fileSize } = await pdfService.generateComprehensiveReport(userId, options);

    return c.json({
      success: true,
      message: 'Report generated successfully',
      report: {
        file_path: filePath,
        file_size: fileSize,
      },
    });
  } catch (error: any) {
    console.error('Error generating report:', error);
    return c.json(
      {
        success: false,
        message: 'Failed to generate report',
        error: error.message,
      },
      500
    );
  }
});

/**
 * Get list of user's reports
 * GET /list
 */
app.get('/list', authenticateToken, async (c) => {
  try {
    const userId = c.get('userId');

    const reports = await pdfService.getUserReports(userId);

    return c.json({
      success: true,
      reports,
    });
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    return c.json(
      {
        success: false,
        message: 'Failed to fetch reports',
        error: error.message,
      },
      500
    );
  }
});

/**
 * Download specific report
 * GET /download/:id
 */
app.get('/download/:id', authenticateToken, async (c) => {
  try {
    const userId = c.get('userId');
    const reportId = parseInt(c.req.param('id'));

    const reports = await pdfService.getUserReports(userId);
    const report = reports.find((r) => r.id === reportId);

    if (!report) {
      return c.json(
        {
          success: false,
          message: 'Report not found',
        },
        404
      );
    }

    // Check if file exists
    if (!fs.existsSync(report.file_path)) {
      return c.json(
        {
          success: false,
          message: 'Report file not found',
        },
        404
      );
    }

    // Read file and send as response
    const fileBuffer = fs.readFileSync(report.file_path);

    return c.body(fileBuffer, 200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="health_report_${reportId}.pdf"`,
      'Content-Length': fileBuffer.length.toString(),
    });
  } catch (error: any) {
    console.error('Error downloading report:', error);
    return c.json(
      {
        success: false,
        message: 'Failed to download report',
        error: error.message,
      },
      500
    );
  }
});

/**
 * Delete report
 * DELETE /:id
 */
app.delete('/:id', authenticateToken, async (c) => {
  try {
    const userId = c.get('userId');
    const reportId = parseInt(c.req.param('id'));

    const deleted = await pdfService.deleteReport(reportId, userId);

    if (!deleted) {
      return c.json(
        {
          success: false,
          message: 'Report not found',
        },
        404
      );
    }

    return c.json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting report:', error);
    return c.json(
      {
        success: false,
        message: 'Failed to delete report',
        error: error.message,
      },
      500
    );
  }
});

export default app;

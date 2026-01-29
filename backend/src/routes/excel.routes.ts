import express from 'express';
import { generateExcel, getHistory, downloadExcel, deleteReport, generateMonthlyReport } from '../controllers/excel.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/generate', authenticateToken, generateExcel);
router.post('/monthly', authenticateToken, generateMonthlyReport);
router.get('/history', authenticateToken, getHistory);
router.get('/download/:id', authenticateToken, downloadExcel);
router.delete('/:id', authenticateToken, deleteReport);

export default router;

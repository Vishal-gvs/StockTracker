import express from 'express';
import { generateExcel, getHistory, downloadExcel } from '../controllers/excel.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/generate', authenticateToken, generateExcel);
router.get('/history', authenticateToken, getHistory);
router.get('/download/:id', authenticateToken, downloadExcel);

export default router;

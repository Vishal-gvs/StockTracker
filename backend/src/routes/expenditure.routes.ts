import { Router } from 'express';
import { addExpenditure, getDailyExpenditure, finalizeDay, exportExpenditures } from '../controllers/expenditure.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';

const router = Router();

router.post('/', authenticateToken, addExpenditure);
router.get('/', authenticateToken, requireAdmin, getDailyExpenditure);
router.post('/finalize', authenticateToken, requireAdmin, finalizeDay);
router.get('/export', authenticateToken, requireAdmin, exportExpenditures);

export default router;

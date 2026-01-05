import { Router } from 'express';
import { getItems, createItem, updateItem } from '../controllers/item.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';

const router = Router();

router.get('/', authenticateToken, getItems);
router.post('/', authenticateToken, requireAdmin, createItem);
router.put('/:id', authenticateToken, requireAdmin, updateItem);

export default router;

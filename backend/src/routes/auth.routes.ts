import { Router } from 'express';
import { login, googleLogin, logout, register } from '../controllers/auth.controller';

const router = Router();

router.post('/login', login);
router.post('/google', googleLogin);
router.post('/logout', logout);
router.post('/register', register); // Optional for setup

export default router;

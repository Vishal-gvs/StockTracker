import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env';

const app = express();
// CORS Middleware MUST be first
app.use(cors({
    origin: config.CLIENT_URL,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Handle Preflight Requests explicitly - Express 5 syntax
app.options('(.*)', cors() as any);

app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Routes
import authRoutes from './routes/auth.routes';
import itemRoutes from './routes/item.routes';
import expenditureRoutes from './routes/expenditure.routes';

app.use('/auth', authRoutes);
app.use('/items', itemRoutes);
app.use('/expenditure', expenditureRoutes);

export default app;

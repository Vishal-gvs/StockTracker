import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env';

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: config.CLIENT_URL,
    credentials: true,
}));

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

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import proposalRoutes from './routes/proposalRoutes';

const app = express();
const port = process.env.NODE_PORT || 8080;
const corsOptions = {
    origin: process.env.ALLOWED_CORS_ORIGIN || '*',
};

app.use(cors(corsOptions));
app.use(proposalRoutes);

app.listen(port, () => {
    console.log(`Application is listening on port ${port}`);
});

export default app

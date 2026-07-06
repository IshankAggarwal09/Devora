import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();

app.use(cors());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'execution-engine' });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Execution Engine running on port ${PORT}`);
});

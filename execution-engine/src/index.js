import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { executeCode } from './controllers/execute.controller.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'execution-engine' });
});

app.post('/execute', executeCode);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Execution Engine running on port ${PORT}`);
});

import express from 'express';
import { chatWithBot } from '../controllers/chatController.js';

const chatRouter = express.Router();

chatRouter.post('/message', chatWithBot);

export default chatRouter;

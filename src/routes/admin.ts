import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, authorize } from '../middlewares/auth';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/users', 
  authenticateToken, 
  authorize(['ADMIN']), 
  async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true
        }
      });
      res.json(users);
    } catch (error) {
      res.status(400).json({ error: 'Unable to fetch users' });
    }
});

router.put('/users/:id',
  authenticateToken,
  authorize(['ADMIN']),
  async (req, res) => {
    const { id } = req.params;
    const { name, role } = req.body;

    try {
      const user = await prisma.user.update({
        where: { id },
        data: { name, role },
      });
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: 'Unable to update user' });
    }
});

export default router;
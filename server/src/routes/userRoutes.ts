import { Router } from 'express';
import { searchUsers, updateUserProfile } from '../controllers/userController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// All user routes require valid authentication
router.use(authMiddleware);

// Search contacts
router.get('/', searchUsers);

// Update user profile (name, about, avatarUrl)
router.put('/profile', updateUserProfile);

export default router;

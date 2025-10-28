const express = require('express');
const router = express.Router();
const ideaController = require('../controller/ideaController');
const authMiddleware = require('../midelware/authMiddleware');

router.get('/', authMiddleware, ideaController.getIdeas);
router.get('/completed', authMiddleware, ideaController.getCompletedForCurrentUser);
router.post('/', authMiddleware, ideaController.createIdea);
router.get('/user/:id/completed', ideaController.getCompletedForUser);
router.use(authMiddleware);
router.get('/:id', authMiddleware, ideaController.getIdea);
router.patch('/:id', authMiddleware, ideaController.updateIdea);
router.delete('/:id', authMiddleware, ideaController.deleteIdea);
router.post('/:id/take', authMiddleware, ideaController.takeIdea);
router.post('/:id/release', authMiddleware, ideaController.releaseIdea);
router.post('/:id/complete', authMiddleware, ideaController.completeIdea);

module.exports = router;

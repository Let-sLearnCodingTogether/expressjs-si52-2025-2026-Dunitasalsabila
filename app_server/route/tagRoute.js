const express = require('express');
const router = express.Router();
const tagController = require('../controller/tagController');
const authMiddleware = require('../midelware/authMiddleware');

router.use(authMiddleware);

router.get('/', tagController.getTags);
router.post('/', tagController.createTag);
router.get('/:id', tagController.getTag);
router.patch('/:id', tagController.updateTag);
router.delete('/:id', tagController.deleteTag);

module.exports = router;

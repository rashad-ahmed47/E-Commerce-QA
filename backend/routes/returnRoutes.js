const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  createReturnRequest,
  getMyReturns,
  getAllReturns,
  getReturnById,
  updateReturnStatus,
} = require('../controllers/returnController');
const { protect, admin, supportOrAdmin } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, `return-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

router.route('/')
  .get(protect, supportOrAdmin, getAllReturns)
  .post(protect, upload.array('images', 3), createReturnRequest);

router.get('/myreturns', protect, getMyReturns);
router.route('/:id')
    .get(protect, getReturnById)
    .put(protect, supportOrAdmin, updateReturnStatus);

module.exports = router;

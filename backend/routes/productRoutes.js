const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { 
  getProducts, 
  getProductById, 
  trackProductView,
  getCategories,
  createProduct, 
  bulkUploadProducts, 
  getMyProducts, 
  updateProduct, 
  deleteProduct, 
  createProductReview 
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

// Setup multer for local file uploads
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

function checkFileType(file, cb) {
  // Allow images for product creation, allow csv/excel for bulk
  const filetypes = /jpg|jpeg|png|webp|csv|xlsx|xls/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (extname) {
    return cb(null, true);
  } else {
    cb('Invalid file type!');
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

router.route('/')
  .get(getProducts)
  .post(protect, upload.array('images', 5), createProduct);

router.get('/categories', getCategories);
router.get('/myproducts', protect, getMyProducts);

router.post('/bulk', protect, admin, upload.single('file'), bulkUploadProducts);

router.route('/:id')
  .get(getProductById)
  .put(protect, upload.array('images', 5), updateProduct)
  .delete(protect, deleteProduct);

router.post('/:id/track', protect, trackProductView);
router.route('/:id/reviews').post(protect, createProductReview);

module.exports = router;

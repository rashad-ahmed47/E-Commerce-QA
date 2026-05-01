const Product = require('../models/Product');
const User = require('../models/User');
const fs = require('fs');
const csv = require('csv-parser');
const xlsx = require('xlsx');

const getProducts = async (req, res) => {
  try {
    const pageSize = Math.min(Number(req.query.limit) || 12, 50); // cap at 50
    const page = Math.max(Number(req.query.page) || 1, 1);

    let query = { isHidden: false };

    // Full-text search with text index
    if (req.query.keyword) {
      query.$text = { $search: req.query.keyword };
    }

    // Category filter
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Price filter (on base price field)
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
    }

    // Sort
    let sortObj = {};
    if (req.query.keyword) {
      sortObj = { score: { $meta: 'textScore' } };
    } else {
      const sortStr = req.query.sort || '-createdAt';
      if (sortStr.startsWith('-')) {
        sortObj[sortStr.substring(1)] = -1;
      } else {
        sortObj[sortStr] = 1;
      }
    }

    const count = await Product.countDocuments(query);

    let productsQuery = Product.find(query);
    if (req.query.keyword) {
      productsQuery = productsQuery.select({ score: { $meta: 'textScore' } });
    }

    const products = await productsQuery
      .sort(sortObj)
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({
      products,
      page,
      pages: Math.ceil(count / pageSize),
      total: count,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('parentProduct');
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Track viewed product for user history (optional auth via middleware)
const trackProductView = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { recentlyViewed: { product: req.params.id } },
      });
      await User.findByIdAndUpdate(req.user._id, {
        $push: {
          recentlyViewed: {
            $each: [{ product: req.params.id, viewedAt: new Date() }],
            $position: 0,
            $slice: 20,
          },
        },
      });
    }
    res.status(200).json({ message: 'Tracked' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $match: { isHidden: false } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, sku, price, description, category, stockQuantity, attributes } = req.body;

    const images = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];

    let parsedAttributes = {};
    if (attributes) {
      try {
        parsedAttributes = JSON.parse(attributes);
      } catch {
        return res.status(400).json({ message: 'Invalid attributes JSON format' });
      }
    }

    const product = new Product({
      name,
      sku,
      price,
      description,
      category,
      stockQuantity,
      images,
      attributes: parsedAttributes,
      user: req.user._id,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const bulkUploadProducts = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a CSV or Excel file' });
  }

  const safeDelete = (filepath) => {
    try { fs.unlinkSync(filepath); } catch (_) {}
  };

  try {
    const ext = req.file.originalname.split('.').pop().toLowerCase();

    if (ext === 'xlsx' || ext === 'xls') {
      let workbook;
      try {
        workbook = xlsx.readFile(req.file.path);
      } catch (parseErr) {
        safeDelete(req.file.path);
        return res.status(400).json({ message: `Failed to parse Excel file: ${parseErr.message}` });
      }
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);
      const products = data.map((row) => ({ ...row, user: req.user._id }));
      await processBulkInsert(products, req.file.path, res);

    } else if (ext === 'csv') {
      const products = [];
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => {
          data.user = req.user._id;
          products.push(data);
        })
        .on('error', (err) => {
          safeDelete(req.file.path);
          res.status(400).json({ message: `CSV parse error: ${err.message}` });
        })
        .on('end', async () => {
          await processBulkInsert(products, req.file.path, res);
        });
    } else {
      safeDelete(req.file.path);
      return res.status(400).json({ message: 'Invalid file format. Use .csv or .xlsx' });
    }
  } catch (err) {
    try { fs.unlinkSync(req.file.path); } catch (_) {}
    res.status(500).json({ message: err.message });
  }
};

async function processBulkInsert(products, filepath, res) {
  const safeDelete = (p) => { try { fs.unlinkSync(p); } catch (_) {} };
  try {
    let successCount = 0;
    const errors = [];

    for (let i = 0; i < products.length; i++) {
      try {
        const p = products[i];
        const product = new Product({
          name: p.name,
          sku: p.sku,
          price: Number(p.price),
          description: p.description,
          category: p.category,
          stockQuantity: Number(p.stockQuantity) || 0,
          user: p.user,
        });
        await product.save();
        successCount++;
      } catch (err) {
        errors.push(`Row ${i + 2}: ${err.message}`);
      }
    }

    safeDelete(filepath);
    res.status(201).json({
      message: `Processed ${products.length} rows. ${successCount} successful.`,
      errors: errors.length > 0 ? errors : null,
    });
  } catch (error) {
    safeDelete(filepath);
    res.status(500).json({ message: error.message });
  }
}

const updateProduct = async (req, res) => {
  try {
    const { name, price, description, category, stockQuantity, attributes, isHidden } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.user.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to edit this product' });
    }

    product.name = name || product.name;
    // FIX: use explicit undefined check so price:0 doesn't get skipped
    product.price = price !== undefined ? Number(price) : product.price;
    product.description = description || product.description;
    product.category = category || product.category;
    product.stockQuantity = stockQuantity !== undefined ? Number(stockQuantity) : product.stockQuantity;
    if (isHidden !== undefined) product.isHidden = isHidden;

    // Auto un-hide if stock is replenished
    if (product.stockQuantity > 0 && product.isHidden) {
      product.isHidden = false;
    }

    if (attributes) {
      try {
        product.attributes = JSON.parse(attributes);
      } catch {
        return res.status(400).json({ message: 'Invalid attributes JSON format' });
      }
    }

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => `/uploads/${file.filename}`);
      product.images = [...product.images, ...newImages];
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.user.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    await product.deleteOne();
    res.json({ message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ user: req.user._id }).sort('-createdAt');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ message: 'Rating and comment are required' });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({ message: 'Product already reviewed' });
    }

    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();
    res.status(201).json({ message: 'Review added' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  trackProductView,
  getCategories,
  createProduct,
  bulkUploadProducts,
  getMyProducts,
  updateProduct,
  deleteProduct,
  createProductReview,
};

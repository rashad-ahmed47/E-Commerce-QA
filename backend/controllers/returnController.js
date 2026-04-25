const ReturnRequest = require('../models/ReturnRequest');
const Order = require('../models/Order');
const stockService = require('../services/stockService');
const emailService = require('../services/emailService');

const createReturnRequest = async (req, res) => {
  try {
    const { order, reason, description } = req.body;
    
    // Defaulting to return all items for simplicity unless specific items passed
    // In a real app, frontend would send specific items and quantities
    const orderDoc = await Order.findById(order);
    if (!orderDoc) return res.status(404).json({ message: 'Order not found' });

    let returnItems = [];
    if (req.body.returnItems) {
        returnItems = JSON.parse(req.body.returnItems);
    } else {
        returnItems = orderDoc.orderItems.map(item => ({ product: item.product, qty: item.qty }));
    }

    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    const returnRequest = await ReturnRequest.create({
      user: req.user._id,
      order,
      returnItems,
      reason,
      description,
      images,
      statusLog: [{ status: 'Pending', updatedBy: req.user._id, comment: 'Request submitted' }]
    });

    res.status(201).json(returnRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyReturns = async (req, res) => {
  try {
    const returns = await ReturnRequest.find({ user: req.user._id }).populate('order');
    res.json(returns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllReturns = async (req, res) => {
  try {
    const returns = await ReturnRequest.find({})
        .populate('user', 'name email')
        .populate('order')
        .sort('-createdAt');
    res.json(returns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getReturnById = async (req, res) => {
    try {
        const returnRequest = await ReturnRequest.findById(req.params.id)
            .populate('user', 'name email')
            .populate('order')
            .populate('statusLog.updatedBy', 'name');
            
        if (!returnRequest) return res.status(404).json({ message: 'Not found' });
        
        if (returnRequest.user._id.toString() !== req.user._id.toString() && req.user.role !== 'Admin' && req.user.role !== 'Support') {
            return res.status(401).json({ message: 'Not authorized' });
        }
        
        res.json(returnRequest);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateReturnStatus = async (req, res) => {
  try {
    const returnRequest = await ReturnRequest.findById(req.params.id).populate('user').populate('order');

    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    const newStatus = req.body.status || returnRequest.status;
    const adminComment = req.body.adminComment || returnRequest.adminComment;
    
    // Only process if status actually changed
    if (newStatus !== returnRequest.status) {
        returnRequest.status = newStatus;
        returnRequest.statusLog.push({
            status: newStatus,
            updatedBy: req.user._id,
            comment: adminComment
        });

        // Trigger refund processing logic
        if (newStatus === 'Approved') {
            returnRequest.resolution = 'Refund';
            // Simulated refund calculation
            const order = returnRequest.order;
            let refundAmount = 0;
            returnRequest.returnItems.forEach(ri => {
                const oi = order.orderItems.find(o => o.product.toString() === ri.product.toString());
                if (oi) {
                    refundAmount += oi.price * ri.qty;
                }
            });
            
            returnRequest.refundAmount = refundAmount;
            returnRequest.refundProcessedAt = Date.now();
            
            // Update order refund status
            order.refundStatus = refundAmount >= order.totalPrice ? 'Full' : 'Partial';
            order.refundAmount = refundAmount;
            await order.save();
            
            // Restore stock
            await stockService.restoreStock(returnRequest.returnItems);
            
            // Mark as completed right away for simulated flow
            returnRequest.status = 'Completed';
            returnRequest.statusLog.push({
                status: 'Completed',
                updatedBy: req.user._id,
                comment: 'Refund processed successfully'
            });
        }
        
        // Send email notification to user
        await emailService.sendEmail({
            email: returnRequest.user.email,
            subject: `Update on your return request #${returnRequest._id}`,
            message: `Your return request status has changed to: ${newStatus}.\n\nComments: ${adminComment || 'No additional comments.'}`
        });
    }

    returnRequest.adminComment = adminComment;
    const updatedReturn = await returnRequest.save();
    res.json(updatedReturn);
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createReturnRequest,
  getMyReturns,
  getAllReturns,
  getReturnById,
  updateReturnStatus,
};

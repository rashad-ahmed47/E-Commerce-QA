const Order = require('../models/Order');
const ReturnRequest = require('../models/ReturnRequest');

/**
 * @desc    Customer submits a return request for a delivered order
 * @route   POST /api/returns
 * @access  Private (Customer)
 */
const createReturnRequest = async (req, res) => {
  try {
    const { orderId, reason } = req.body;

    if (!orderId || !reason) {
      return res.status(400).json({ message: 'Order ID and reason are required' });
    }

    if (reason.length < 10) {
      return res.status(400).json({ message: 'Reason must be at least 10 characters' });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify the order belongs to the requesting user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to return this order' });
    }

    // Only delivered orders can be returned
    if (!order.isDelivered) {
      return res.status(400).json({ message: 'Only delivered orders can be returned' });
    }

    // Check if a return request already exists for this order
    const existingReturn = await ReturnRequest.findOne({ order: orderId });
    if (existingReturn) {
      return res.status(409).json({ message: 'A return request already exists for this order' });
    }

    const returnRequest = await ReturnRequest.create({
      order: orderId,
      user: req.user._id,
      reason,
    });

    res.status(201).json(returnRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Support agent processes a refund (approve/reject a return request)
 * @route   PUT /api/returns/:id/refund
 * @access  Private (Support / Admin)
 */
const processRefund = async (req, res) => {
  try {
    const { action, adminNotes } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be either "approve" or "reject"' });
    }

    const returnRequest = await ReturnRequest.findById(req.params.id);

    if (!returnRequest) {
      return res.status(404).json({ message: 'Return request not found' });
    }

    // Only pending requests can be processed
    if (returnRequest.status !== 'Pending') {
      return res.status(400).json({ message: 'This return request has already been processed' });
    }

    if (action === 'approve') {
      const order = await Order.findById(returnRequest.order);
      if (!order) {
        return res.status(404).json({ message: 'Associated order not found' });
      }

      returnRequest.status = 'Approved';
      returnRequest.refundAmount = order.totalPrice;
      returnRequest.refundedAt = new Date();
      order.status = 'Returned';
      await order.save();
    } else {
      returnRequest.status = 'Rejected';
    }

    returnRequest.adminNotes = adminNotes || '';
    returnRequest.processedBy = req.user._id;
    await returnRequest.save();

    res.status(200).json(returnRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createReturnRequest,
  processRefund,
};

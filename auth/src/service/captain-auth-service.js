import WithdraRequestModel from "../modals/WithdrawRequestModal.js";

export const handleWithdrawRequestService = async (body, user) => {
  const {
    paymnetBank,
    holderName,
    bankName,
    accountNumber,
    ifscCode,
    upiId,
    money,
  } = body;

  // Create a new withdrawal transaction
  const newTransaction = new WithdraRequestModel({
    user: user._id,
    paymnetBank,
    holderName,
    bankName,
    accountNumber,
    ifscCode,
    upiId,
    money,
  });

  await newTransaction.save();

  // Update user's wallet balance
  user.walletBalance -= +money;
  await user.save();

  return user;
};

export const getWithdrawRequestService = async ({ page, limit, fromDate }) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const from = new Date(fromDate);
  const to = new Date(fromDate);
  to.setHours(23, 59, 59, 999);

  const dateFilter = {
    createdAt: {
      $gte: from,
      $lte: to,
    },
  };

  const [withdrawData, totalWithdrawRequestToday, approvedRequest] =
    await Promise.all([
      WithdraRequestModel.find({ ...dateFilter, isPayed: false })
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      WithdraRequestModel.countDocuments(dateFilter),
      WithdraRequestModel.countDocuments({ ...dateFilter, isPayed: true }),
    ]);

  return {
    withdrawData,
    totalPages: Math.ceil(totalWithdrawRequestToday / limit),
    currentPage: parseInt(page),
    totalWithdrawRequestToday,
    approvedRequest,
  };
};

export const withdrawRequestPayService = async (id) => {
  return await WithdraRequestModel.findByIdAndUpdate(
    id,
    { $set: { isPayed: true } },
    { new: true }
  );
};

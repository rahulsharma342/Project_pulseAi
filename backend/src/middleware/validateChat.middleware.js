// Validate chat query before consuming monthly usage
const validateChatQuery = (req, res, next) => {
  const { query } = req.body;

  if (!query || typeof query !== "string" || !query.trim()) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid query",
    });
  }

  next();
};

export default validateChatQuery;
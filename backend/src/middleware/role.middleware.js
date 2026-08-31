const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user exists (should be attached by protect middleware)
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized, no user data');
    }

    // Check if user's role is in the allowed roles list
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Role [${req.user.role}] is not authorized to access this route`);
    }

    next();
  };
};

module.exports = { authorize };

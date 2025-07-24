const jwt = require('jsonwebtoken');
const User = require('../models/User'); // adjust path if needed

// ✅ Check if token is valid and attach full user object
const authenticate = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access Denied: No token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id); // get full user
    if (!user) return res.status(403).json({ message: 'User not found' });

    req.user = user; // now includes name, email, role, etc.
    next();
  } catch (err) {
    res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// ✅ Check if user has required role
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access Denied: Unauthorized role' });
    }
    next();
  };
};

module.exports = { authenticate, authorizeRoles };

const jwt = require("jsonwebtoken");//auth establishment

const authRequired = (req, res, next) => {
  if (req.session && req.session.user){
    req.user = req.session.user;
    return next();
  }

  const token =
    req.cookies?.token ||
    (req.headers.authorization
      ? req.headers.authorization.replace("Bearer ", "")
      : null);
  if(!token){
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
const requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ message: "Forbidden" });
  }
  return next();
};
module.exports = { authRequired, requireRole };

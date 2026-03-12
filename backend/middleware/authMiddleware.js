const jwt = require("jsonwebtoken");

module.exports = (req,res,next)=>{
  const token = req.headers.authorization?.split(" ")[1];

  if(!token) return res.status(401).json({msg:"No Token"});

  jwt.verify(token, process.env.JWT_SECRET, (err,user)=>{
    if(err) return res.status(403).json({msg:"Invalid Token"});
    req.user = user;
    next();
  });
};

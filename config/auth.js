import dotenv from "dotenv";
import jwt from 'jsonwebtoken';
dotenv.config();

const auth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    
    
    if (!token) {
      return res.status(401).json({ msg: "User not authenticated", success: false });
    }
    
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
  
    
    req.user = decoded;
    next();  
  } catch (error) {
    console.error("Auth Error:", error);
    return res.status(401).json({ msg: "Invalid Token", success: false });
  }
};

export default auth;

import jwt from "jsonwebtoken";

// Verifies the Bearer token on the request and attaches { id, email } to req.user
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) {
        return res.status(401).json({ error: "Not authenticated. Please log in." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, email }
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired session. Please log in again." });
    }
};

export default requireAuth;

const auth = require("./authMiddleware");
const { findUserByKey, KEY_PREFIX } = require("../controllers/automationKeyController");

// Accepts either a normal login token or an automation key ("etk_…").
// Used only on routes an automation is allowed to call. The key may also come
// as ?key=… so iPhone Shortcuts needs no header (a stray space in a typed
// header name makes the HTTP/2 request fail with "network connection lost").
module.exports = async (req, res, next) => {
  const queryKey = typeof req.query.key === "string" ? req.query.key.trim() : "";
  const token = req.headers.authorization?.split(" ")[1] || queryKey;
  if (!token?.startsWith(KEY_PREFIX)) return auth(req, res, next);

  try {
    const userId = await findUserByKey(token);
    if (!userId) return res.status(401).json({ msg: "Invalid or revoked automation key" });
    req.user = { id: userId, viaAutomationKey: true };
    next();
  } catch (err) {
    console.error("Automation auth error:", err);
    res.status(500).json({ msg: "Server Error" });
  }
};

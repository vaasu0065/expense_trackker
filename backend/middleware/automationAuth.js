const auth = require("./authMiddleware");
const { findUserByKey, KEY_PREFIX } = require("../controllers/automationKeyController");

// Accepts either a normal login token or an automation key ("etk_…").
// Used only on routes an automation is allowed to call.
module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
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

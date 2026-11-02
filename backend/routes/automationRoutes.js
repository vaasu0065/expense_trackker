const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { getKey, createKey, revokeKey } = require("../controllers/automationKeyController");

// Managing keys always needs a real login, never an automation key
router.get("/key", auth, getKey);
router.post("/key", auth, createKey);
router.delete("/key", auth, revokeKey);

module.exports = router;

const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const {
  getStatus,
  createConnection,
  approveMockConnection,
  syncTransactions,
} = require("../controllers/bankController");

router.get("/status", auth, getStatus);
router.post("/connect", auth, createConnection);
router.post("/mock/approve", auth, approveMockConnection);
router.post("/sync", auth, syncTransactions);

module.exports = router;

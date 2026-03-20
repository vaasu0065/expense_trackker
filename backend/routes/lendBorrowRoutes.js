const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const { getAll, add, settle, remove, summary } = require("../controllers/lendBorrowController");

router.get("/", auth, getAll);
router.post("/", auth, add);
router.patch("/:id/settle", auth, settle);
router.delete("/:id", auth, remove);
router.get("/summary", auth, summary);

module.exports = router;

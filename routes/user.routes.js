const router = require("express").Router();
const {
  register,
  login,
  auth,
  index,
  show,
  update,
  avatar,
  destroy,
} = require("../controllers/user.controllers");
const restrict = require("../middlewares/auth.middlewares");
const { image } = require("../libs/multer");

// User API
router.get("/users", index);
router.get("/users/:id", show);
router.put("/users/:id/profile", restrict, update);
router.put("/users/:id/avatar", restrict, image.single("image"), avatar);
router.delete("/users/:id", restrict, destroy);

// Auth API
router.post("/auth/register", register);
router.post("/auth/login", login);
router.get("/auth/authenticate", restrict, auth);

module.exports = router;

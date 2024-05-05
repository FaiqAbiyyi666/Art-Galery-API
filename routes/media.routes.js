const router = require("express").Router();
const {
  create,
  index,
  show,
  update,
  destroy,
} = require("../controllers/media.controllers");
const restrict = require("../middlewares/auth.middlewares");
const { image } = require("../libs/multer");

// Image API
router.post("/image", restrict, image.single("image"), create);
router.get("/image", index);
router.get("/image/:id", show);
router.put("/image/:id/", restrict, update);
router.delete("/image/:id", restrict, destroy);

module.exports = router;

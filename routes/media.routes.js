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

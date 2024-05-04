const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const path = require("path");
const imageKit = require("../libs/imagekit");
const { nextTick } = require("process");

module.exports = {
  create: async (req, res, next) => {
    try {
      let { title, description } = req.body;

      if (!req.file || !title || !description) {
        return res.status(401).json({
          status: false,
          message: "Input must be required",
          data: null,
        });
      }

      let exist = await prisma.image.findFirst({
        where: { title },
      });

      if (exist) {
        return res.status(400).json({
          status: false,
          message: "Title has been used!",
          data: null,
        });
      }

      let strFile = req.file.buffer.toString("base64");

      let { url, fileId } = await imageKit.upload({
        fileName: Date.now() + path.extname(req.file.originalname),
        file: strFile,
      });

      let imagePost = await prisma.image.create({
        data: {
          title,
          description,
          image_url: url,
          user_id: req.user.id,
          image_id: fileId,
        },
      });

      return res.status(201).json({
        status: true,
        message: "Succes upload image",
        data: { imagePost },
      });
    } catch (error) {
      next(error);
    }
  },
};

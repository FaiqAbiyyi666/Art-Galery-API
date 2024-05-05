const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const path = require("path");
const imageKit = require("../libs/imagekit");

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

  index: async (req, res, next) => {
    try {
      let { search } = req.query;

      let image = await prisma.image.findMany({
        where: {
          first_name: { contains: search, mode: "insensitive" },
        },
      });

      image.forEach((image) => {
        delete image.image_id;
        delete image.user_id;
      });

      res.status(200).json({
        status: true,
        message: "OK",
        data: image,
      });
    } catch (error) {
      next(error);
    }
  },

  show: async (req, res, next) => {
    try {
      let id = Number(req.params.id);
      let image = await prisma.image.findUnique({
        where: { id },
      });

      if (!image) {
        return res.status(400).json({
          status: false,
          message: "Can't find image with id " + id,
          data: null,
        });
      }

      delete image.image_id;

      res.status(200).json({
        status: true,
        message: "OK",
        data: image,
      });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      let id = Number(req.params.id);

      let exist = await prisma.image.findUnique({
        where: { id },
      });

      if (!exist) {
        return res.status(400).json({
          status: false,
          message: "Can't find image with id " + id,
          data: null,
        });
      }

      let { title, description } = req.body;

      if (!title && !description) {
        return res.status(400).json({
          status: false,
          message:
            "At least one piece of data needs to be provided for the update to occur.",
          data: null,
        });
      }

      let image = await prisma.image.update({
        where: { id },
        data: {
          title,
          description,
        },
      });

      delete image.image_id;

      res.status(200).json({
        status: true,
        message: "Image update success",
        data: image,
      });
    } catch (error) {
      next(error);
    }
  },

  destroy: async (req, es, next) => {
    try {
      let id = Number(req.params.id);

      let exist = await prisma.image.findUnique({
        where: { id },
      });

      if (!exist) {
        return res.status(400).json({
          status: false,
          message: "Can't find image with id " + id,
          data: null,
        });
      }

      imageKit.deleteFile(exist.image_id, async (error, result) => {
        if (error) {
          console.log("Error", error);
          return res.status(500).json({
            status: false,
            message: "Failed to delete image",
          });
        }
        console.log("Result", result);
      });

      await prisma.image.delete({
        where: { id },
      });

      res.status(200).json({
        status: true,
        message: "Images have been successfully deleted",
      });
    } catch (error) {
      next(error);
    }
  },
};

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const imageKit = require("../libs/imagekit");
const path = require("path");
const jwt = require("jsonwebtoken");
const { JWT_SECRET_KEY } = process.env;

module.exports = {
  register: async (req, res, next) => {
    try {
      let { first_name, last_name, email, password } = req.body;
      let exist = await prisma.user.findUnique({ where: { email } });

      if (!first_name || !last_name || !email || !password) {
        return res.status(400).json({
          status: false,
          message: "Input must be required",
          data: null,
        });
      } else if (exist) {
        return res.status(401).json({
          status: false,
          message: "Email already used!",
        });
      }

      let encryptedPassword = await bcrypt.hash(password, 10);

      let user = await prisma.user.create({
        data: {
          first_name,
          last_name,
          email,
          password,
        },
      });

      return res.status(200).json({
        status: true,
        message: "OK",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  login: async (req, res, next) => {
    try {
      let { email, password } = req.body;
      let user = await prisma.user.findFirst({ where: { email } });

      if (!user) {
        return res.status(400).json({
          status: false,
          message: "Invalid email or password!",
          data: null,
        });
      }

      let isPassCorrect = await bcrypt.compare(password, user.password);
      if (!isPassCorrect) {
        return res.status(400).json({
          status: false,
          message: "Invalid email or password!",
          data: null,
        });
      }

      delete user.address;
      delete user.occupation;
      delete user.avatar_url;
      delete user.avatar_id;
      delete user.password;
      let token = jwt.sign(user, JWT_SECRET_KEY);

      return res.status(201).json({
        status: true,
        message: "OK",
        data: { ...user, token },
      });
    } catch (error) {
      next(error);
    }
  },

  auth: async (req, res, next) => {
    try {
      const user = req.user;
      delete user.avatar_id;

      return res.status(200).json({
        status: true,
        message: "OK",
        data: req.user,
      });
    } catch (error) {
      next(error);
    }
  },

  index: async (req, res, next) => {
    try {
      let { search } = req.query;

      let users = await prisma.user.findMany({
        where: {
          first_name: { contains: search, mode: "insensitive" },
        },
      });

      users.forEach((user) => {
        delete user.password;
        delete user.address;
        delete user.occupation;
        delete user.avatar_url;
        delete user.avatar_id;
      });

      res.status(200).json({
        status: true,
        message: "OK",
        data: users,
      });
    } catch (error) {
      next(error);
    }
  },

  show: async (req, res, next) => {
    try {
      let id = Number(req.params.id);

      let user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        return res.status(400).json({
          status: false,
          message: "Can't find user with id " + id,
          data: null,
        });
      }

      delete user.password;
      delete user.avatar_id;

      res.status(200).json({
        status: true,
        message: "OK",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      let id = Number(req.params.id);

      let exist = await prisma.user.findUnique({
        where: { id },
      });

      if (!exist) {
        return res.status(400).json({
          status: false,
          message: "Can't find user with id " + id,
          data: null,
        });
      }

      let { first_name, last_name, address, occupation } = req.body;

      if (!first_name && !last_name && !address && !occupation) {
        return res.status(400).json({
          status: false,
          message:
            "At least one piece of data needs to be provided for the update to occur.",
          data: null,
        });
      }

      const user = await prisma.user.update({
        where: { id },
        data: {
          first_name,
          last_name,
          address,
          occupation,
        },
      });

      delete user.password;
      delete user.avatar_id;

      res.status(200).json({
        status: true,
        message: "User updated success",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  avatar: async (req, res, next) => {
    try {
      let id = Number(req.params.id);

      let user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        return res.status(400).json({
          status: false,
          message: "Can't find user with id " + id,
          data: null,
        });
      }

      let avatar = req.file.buffer.toString("base64");

      let response = await imagekit.upload({
        fileName: Date.now() + path.extname(req.file.originalname),
        file: avatar,
      });

      let updateUserAvatar = await prisma.user.update({
        where: { id },
        data: { avatar_url: response.url },
      });

      delete updateUserAvatar.password;
      delete updateUserAvatar.avatar_id;

      res.status(200).json({
        status: true,
        message: "Avatar update success",
        data: updateUserAvatar,
      });
    } catch (error) {
      next(error);
    }
  },

  destroy: async (req, es, next) => {
    try {
      let id = Number(req.params.id);

      let exist = await prisma.user.findUnique({
        where: { id },
        include: { image: true },
      });

      if (!exist) {
        return res.status(400).json({
          status: false,
          message: "Can't find user with id " + id,
          data: null,
        });
      }

      if (exist.avatar_id) {
        imageKit.deleteFile(exist.avatar_id, async (error, result) => {
          if (error) {
            console.log("Error", error);
            return res.status(500).json({
              status: false,
              message: "Failed to delete avatar",
            });
          }
          console.log("Result", result);
        });
      }

      for (const image of exist.image) {
        try {
          if (image.image_id) {
            await imageKit.deleteFile(image.image_id);
          } else {
            console.log("Image ID is absent for the image:", image.id);
          }
        } catch (error) {
          console.error(
            "Deleting the image from ImageKit failed:",
            error.message
          );
        }
      }

      await prisma.image.deleteMany({
        where: { user_id: id },
      });

      await prisma.user.delete({
        where: { id },
      });

      res.status(200).json({
        status: true,
        message:
          "The user and its associated images have been successfully deleted",
      });
    } catch (error) {
      next(error);
    }
  },
};

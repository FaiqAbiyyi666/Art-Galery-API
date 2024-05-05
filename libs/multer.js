const multer = require("multer");

const generateFileFilter = (mimetypes, maxFileSize) => {
  return (req, file, callback) => {
    const fileSize = parseInt(req.headers[`content-length`]);
    // const maxFileSize = null;
    if (fileSize > maxFileSize) {
      const err = new Error(`Maximum file size 1MB!`);
      return callback(err, false);
    }
    if (mimetypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      let err = new Error(`Only ${mimetypes} are allowed to upload!`);
      callback(err, false);
    }
  };
};

module.exports = {
  image: multer({
    fileFilter: generateFileFilter(
      ["image/png", "image/jpg", "image/jpeg"],
      5000000
    ),
    onError: (err, next) => {
      next(err);
    },
  }),
};

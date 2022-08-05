const express = require("express");
const Superhero = require("../../models/superhero");
const router = express.Router();
const { createError } = require("../../helpers");
const fs = require("fs").promises;
const Joi = require("joi");
const upload = require("../../multer/multerConfig");
const { nanoid } = require("nanoid");
const path = require("path");

Joi.objectId = require("joi-objectid")(Joi);
const idScheme = Joi.object({
  id: Joi.objectId(),
});

const deletePhotosScheme = Joi.string().required();

const updateHeroScheme = Joi.object({
  nickname: Joi.string(),
  realName: Joi.string(),
  originDescription: Joi.string(),
  superpowers: Joi.array().items(Joi.string()),
  catchPhrase: Joi.string(),
});
router.get("/", async (req, res, next) => {
  try {
    const { page, limit } = req.query;

    if (page && limit) {
      const total = await Superhero.countDocuments({});
      const superheroes = await Superhero.find({}, "nickname avatar")

        .limit(Number(limit))
        .skip(Number(page) * Number(limit));
      if (!superheroes) throw createError(404, "No superhero is found");
      res.status(200).json({ total, superheroes });
    }
    if (!page && !limit) {
      const superheroes = await Superhero.find({}, "nickname images").select({
        images: { $elemMatch: { avatar: true } },
      });

      if (!superheroes) throw createError(404, "No superhero is found");
      res.status(200).json(superheroes);
    }
  } catch (error) {
    next(error);
  }
});
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = idScheme.validate({ id });

    if (error) throw createError(400, error.message);
    const superhero = await Superhero.findById(id);

    if (!superhero) throw createError(404, "No superhero is found");
    res.status(200).json(superhero);
  } catch (error) {
    next(error);
  }
});
router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = updateHeroScheme.validate(req.body);

    if (error) throw createError(400, error.message);
    const superhero = await Superhero.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!superhero) throw createError(404, "No superhero is found");
    res.status(200).json(superhero);
  } catch (error) {
    next(error);
  }
});
router.patch("/:id/avatar", upload.single("avatar"), async (req, res, next) => {
  const avatarPath = path.join(__dirname, "..", "..", "public", "avatar");
  const { path: tempDir, originalname } = req.file;
  if (!tempDir) throw createError(400, "No file is passed");
  const [extension] = originalname.split(".").reverse();
  const idAvatar = nanoid();
  const newName = `${idAvatar}.${extension}`;
  const uploadDir = path.join(avatarPath, newName);
  const avatarURL = path.join("avatar", newName);

  try {
    const { id } = req.params;
    const user = await Superhero.findById(id);
    if (!user) throw createError(404, "Superhero is not found");
    await fs.rename(tempDir, uploadDir);
    const superHero = await Superhero.findByIdAndUpdate(
      id,
      { avatar: avatarURL },
      {
        new: true,
      }
    );

    const oldAvatarPath = path.join(
      __dirname,
      "..",
      "..",
      "public",
      user.avatar
    );
    fs.unlink(oldAvatarPath);
    res.json(superHero);
  } catch (error) {
    fs.unlink(req.file.path);
    next(error);
  }
});
router.post("/", upload.single("avatar"), async (req, res, next) => {
  const avatarPath = path.join(__dirname, "..", "..", "public", "avatar");
  const { path: tempDir, originalname } = req.file;
  if (!tempDir) throw createError(400, "No file is passed");
  const [extension] = originalname.split(".").reverse();
  const id = nanoid();
  const newName = `${id}.${extension}`;
  const uploadDir = path.join(avatarPath, newName);
  const avatarURL = path.join("avatar", newName);
  try {
    await fs.rename(tempDir, uploadDir);

    const isSuperHeroInDB = await Superhero.findOne({
      $or: [
        {
          nickname: req.body.nickname,
        },
        { realName: req.body.realName },
      ],
    });

    if (isSuperHeroInDB)
      throw createError(409, "This superhero already exists");
    const heroObj = {
      nickname: req.body.nickname,
      realName: req.body.realName,
      originDescription: req.body.originDescription,
      superpowers: req.body.superpowers.split(","),
      catchPhrase: req.body.catchPhrase,
      avatar: avatarURL,
    };

    const addedSuperhero = await Superhero.create(heroObj);
    res.status(201).json(addedSuperhero);
  } catch (error) {
    await fs.unlink(req.file.path);
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const removedContact = await Superhero.findByIdAndDelete(id);
    if (removedContact) res.json({ message: "Successfully deleted" });
    else next();
  } catch (error) {
    next(error);
  }
});

router.post("/:id/photos", upload.single("image"), async (req, res, next) => {
  try {
    const imagesPath = path.join(__dirname, "..", "..", "public", "images");
    const { path: tempDir, originalname } = req.file;
    const [extension] = originalname.split(".").reverse();
    const idImg = nanoid();
    const newName = `${idImg}.${extension}`;
    const uploadDir = path.join(imagesPath, newName);
    const imgURL = path.join("images", newName);

    await fs.rename(tempDir, uploadDir);
    const { id } = req.params;
    const superhero = await Superhero.findById(id);
    if (!superhero) throw createError(404, "There is no such a hero");
    const newImages = [...superhero.images, imgURL];
    const updateSuperhero = await Superhero.findByIdAndUpdate(
      id,
      {
        images: newImages,
      },
      { new: true }
    );
    res.json(updateSuperhero);
  } catch (error) {
    await fs.unlink(req.file.path);
    next(error);
  }
});
router.patch("/:id/photos/delete", async (req, res, next) => {
  try {
    const { id } = req.params;

    const { src } = req.body;

    const user = await Superhero.findById(id);
    if (!user) throw createError(404, "No user is found");

    const imageToDelete = user.images.find((elem) => elem === src);
    if (!imageToDelete) throw createError(404, "No such an image");

    const updatedImages = user.images.filter((elem) => elem !== src);
    const updatedUser = await Superhero.findByIdAndUpdate(
      id,
      { images: updatedImages },
      {
        new: true,
      }
    );
    const pathToPhoto = path.join(__dirname, "..", "..", "public", src);
    if (!updatedUser) next();
    await fs.unlink(pathToPhoto);
    res.json(updatedUser);
  } catch (error) {
    console.log(error.message);
    next(error);
  }
});

module.exports = router;

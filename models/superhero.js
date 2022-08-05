const { Schema, model } = require("mongoose");
const superheroSchema = Schema(
  {
    nickname: {
      type: String,
      required: [true, "Superhero must have the name"],
      unique: true,
    },
    realName: {
      type: String,
      required: [true, "There are must be a real name"],
    },
    originDescription: {
      type: String,
      default: "",
    },
    superpowers: {
      type: [String],
      default: [],
    },
    catchPhrase: {
      type: String,
      default: "I am a superhero",
    },
    images: {
      type: [String],
      default: [],
    },
    avatar: {
      type: String,
      required: [true, "Hero must have an avatar"],
      default:
        "https://st2.depositphotos.com/5934840/12040/v/380/depositphotos_120409748-stock-illustration-superhero-avatar-superman-comic-design.jpg?forcejpeg=true",
    },
  },
  { versionKey: false, timestamps: true }
);
const Superhero = model("superhero", superheroSchema);

module.exports = Superhero;

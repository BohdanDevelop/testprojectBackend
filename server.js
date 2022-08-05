const app = require("./app");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const { DB_HOST, PORT = 8080 } = process.env;
mongoose
  .connect(DB_HOST)
  .then(() => {
    console.log("db is connected");
    app.listen(PORT, () => {
      console.log("Server running. Use our API on port: 3000");
    });
  })
  .catch((error) => {
    console.log(error.message);
    process.exit(1);
  });

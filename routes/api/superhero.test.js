const mongoose = require("mongoose");

const request = require("supertest");
const app = require("../../app");
const path = require("path");
const Superhero = require("../../models/superhero");
require("dotenv").config();
const fs = require("fs").promises;
const { DB_HOST_TEST } = process.env;
describe("router test", () => {
  let server;
  beforeAll(() => (server = app.listen(8080)));
  afterAll(() => server.close());
  beforeEach((done) => {
    mongoose.connect(DB_HOST_TEST).then(() => done());
  });
  afterEach((done) => {
    mongoose.connection.close();
    done();
  });
  // afterEach((done) => {
  //   mongoose.connection.db.dropCollection(() => {
  //     mongoose.connection.close(() => done());
  //   });
  // });
  test("get heroes", async () => {
    const response = await request(app).get("/api/superhero").send();
    expect(response.statusCode).toBe(200);
  });
  test("create hero", async () => {
    const newHero = {
      nickname: "Superman",
      realName: "Some realName",
      originDescription: "Nobody cares",
      superpowers: ["fly", "x-ray vision"],
      catchPhrase: "Cringe",
    };

    const response = await request(app)
      .post("/api/superhero")
      .field("nickname", "Superman")
      .field("realName", "whatever")
      .field("originDescription", "whatever")
      .field("superpowers", ["fly"])
      .field("catchPhrase", "whatever")
      .attach("avatar", `routes/api/soldierBoy.webp`);

    expect(response).toBe(201);
  });
  test("Test patching nickname", async () => {
    const response = await request(app)
      .get("/api/superhero/62ed010aa6264c08e1001e5a")
      .send({ nickname: "snowman" });
    expect(response.statusCode).toBe(200);
  });
});

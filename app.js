const express = require("express");
const app = express();
const path = require("path");
const connectionDb = require("./db/connectionDb");
const userModel = require("./models/userModel");
const dotenv = require("dotenv").config({ path: "./.env" });

connectionDb();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

// Register page
app.get("/", (req, res) => {
  res.render("register");
});

// Register
app.post("/register", async (req, res) => {
  let { name, age, gender, phoneNumber, email } = req.body;
  let user = await userModel.findOne({ email });
  if (user) {
    res.send("Email already exists");
  } else {
    let createUser = await userModel.create({
      name,
      age,
      gender,
      phoneNumber,
      email,
    });
    res.json({
      status: 200,
      message: "User created successfully",
      data: createUser,
    });
  }
});

// Login page
app.get("/login", (req, res) => {
  res.render("login");
});

// Login
app.post("/login", async (req, res) => {
  let { email } = req.body;
  let user = await userModel.findOne({ email });
  if (user) {
    res.send("Login successful");
  } else {
    res.send("Invalid credentials");
  }
});


// Port
const port = process.env.PORT || 3000;
app.listen(3000, (err) => {
  if (err) {
    console.log(err);
  }
  console.log(`Server started on port localhost:${port}`);
});

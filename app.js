const express = require("express");
const app = express();
const path = require("path");
const connectionDb = require("./db/connectionDb");
const userModel = require("./models/userModel");
const dotenv = require("dotenv")

dotenv.config({ path: "./.env" });

connectionDb();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

// Home page
app.get("/", (req, res) => {
  res.render("index");
});

// Register page
app.get("/register", (req, res) => {
  res.render("register");
});

// Register
app.post("/register", async (req, res) => {
  let { name, age, gender, phoneNumber, email } = req.body;
  if(!name || !age || !gender || !phoneNumber || !email) {
    res.send("Please fill all the fields");
  }
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
    res.redirect("/login");
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
    res.send("Invalid Email");
  }
});


// Port
const port = process.env.PORT || 4000;
app.listen(port, (err) => {
  if (err) {
    console.log(err);
  }
  console.log(`Server started on port localhost:${port}`);
});

const express = require("express");
const app = express();
const path = require("path");
const connectionDb = require("./db/connectionDb");
const userModel = require("./models/userModel");
const dotenv = require("dotenv")
const session = require("express-session");
const flash = require("connect-flash");

dotenv.config({ path: "./.env" });

connectionDb();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.use(session({
  secret: "secret",
  resave: false,
  saveUninitialized: false,
}));
app.use(flash());


// Home page
app.get("/", (req, res) => {
  res.render("index");
});

// Register page
app.get("/register", (req, res) => {
  let errors = req.flash("error");
  res.render("register" , {errors});
});

// Register
app.post("/register", async (req, res) => {
  let { name, age, gender, phoneNumber, email } = req.body;
  if(!name || !age || !gender || !phoneNumber || !email) {
    req.flash("error", "All fields are required");
    return res.redirect("/register");
  }
  let user = await userModel.findOne({ email });
  if (user) {
    req.flash("error", "User already exists");
    return res.redirect("/register");
  } else {
    let createUser = await userModel.create({
      name,
      age,
      gender,
      phoneNumber,
      email,
    });
    req.flash("success", "User created successfully");
    res.redirect("/login");
  }
});

// Login page
app.get("/login", (req, res) => {
  let success = req.flash("success");
  res.render("login", {success});
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
  console.log(`Server started on port http://localhost:${port}`);
});

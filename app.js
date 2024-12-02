const express = require("express");
const app = express();
const path = require("path");
const connectionDb = require("./db/connectionDb");
const userModel = require("./models/userModel");
const dotenv = require("dotenv");
const session = require("express-session");
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const isloggedin = require("./utils/isLoggedin");
const medicalInfo = require("./models/medicalInfo");

dotenv.config({ path: "./.env" });

connectionDb();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(flash());
app.use(cookieParser());

// Home page
app.get("/", (req, res) => {
  res.render("index");
});

// Register page
app.get("/register", (req, res) => {
  let errors = req.flash("error");
  res.render("register", { errors });
});

// Register
app.post("/register", async (req, res) => {
  let { name, age, gender, phoneNumber, email } = req.body;
  if (!name || !age || !gender || !phoneNumber || !email) {
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
  let errors = req.flash("error");
  res.render("login", { success, errors });
});

// Login
app.post("/login", async (req, res) => {
  let { email } = req.body;
  let user = await userModel.findOne({ email });
  if (user) {
    let token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.cookie("token", token, {
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
      httpOnly: true,
    });
    res.redirect("/home");
  } else {
    req.flash("error", "User does not exist");
    res.redirect("/login");
  }
});

// HOME PAGE

app.get("/home", isloggedin, async (req, res) => {
  let userId = (req.user = jwt.verify(
    req.cookies.token,
    process.env.JWT_SECRET
  ));
  const user = await userModel.findById(userId.id).select("-password");

  const medications = await medicalInfo
    .find({ user: user._id })
    .populate("user", "name")
    .sort({ createdAt: -1 });

  res.render("homepage", { user, medications });
});

app.post("/medication", isloggedin, async (req, res) => {
  let { condition, medicine, dose, time } = req.body;
  let userId = (req.user = jwt.verify(
    req.cookies.token,
    process.env.JWT_SECRET
  ));
  const user = await userModel.findById(userId.id).select("-password");
  const newMedication = await medicalInfo.create({
    condition,
    medicine,
    dose,
    time,
    user: user._id,
  });
  res.redirect("/home");
});

app.get("/delete/:_id", isloggedin, async (req, res) => {
  let id = req.params._id;
  // console.log(id);
  let user = await medicalInfo.findByIdAndDelete(id);
  res.redirect("/home");
});

// Logout
app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
});

// Port
const port = process.env.PORT || 4000;
app.listen(port, (err) => {
  if (err) {
    console.log(err);
  }
  console.log(`Server started on port http://localhost:${port}`);
});

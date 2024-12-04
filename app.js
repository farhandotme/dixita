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
const memberModel = require("./models/memberModel");
const memberMedical = require("./models/memberMedical");

dotenv.config({ path: "./.env" });

// Connect to the database
connectionDb();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(flash());
app.use(cookieParser());

// ------------------- Routes -------------------

// Home page
app.get("/", (req, res) => {
  res.render("index");
});

// Register page
app.get("/register", (req, res) => {
  const errors = req.flash("error");
  res.render("register", { errors });
});

// POST Register
app.post("/register", async (req, res) => {
  const { name, age, gender, phoneNumber, email } = req.body;

  if (!name || !age || !gender || !phoneNumber || !email) {
    req.flash("error", "All fields are required");
    return res.redirect("/register");
  }

  const userExists = await userModel.findOne({ email });
  if (userExists) {
    req.flash("error", "User already exists");
    return res.redirect("/register");
  }

  await userModel.create({ name, age, gender, phoneNumber, email });
  req.flash("success", "User created successfully");
  res.redirect("/login");
});

// Login page
app.get("/login", (req, res) => {
  const success = req.flash("success");
  const errors = req.flash("error");
  res.render("login", { success, errors });
});

// POST Login
app.post("/login", async (req, res) => {
  const { email } = req.body;

  const user = await userModel.findOne({ email });
  if (user) {
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.cookie("token", token, {
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
      httpOnly: true,
    });
    return res.redirect("/home");
  }

  req.flash("error", "User does not exist");
  res.redirect("/login");
});

// Home page (protected)
app.get("/home", isloggedin, async (req, res) => {
  try {
    const userId = jwt.verify(req.cookies.token, process.env.JWT_SECRET).id;

    const user = await userModel
      .findById(userId)
      .populate("members")
      .select("-password");
    const medications = await medicalInfo
      .find({ user: user._id })
      .sort({ createdAt: -1 });

    res.render("homepage", { user, medications, members: user.members });
  } catch (error) {
    console.error("Error fetching home data:", error);
    req.flash("error", "Failed to load home page");
    res.redirect("/login");
  }
});

// Add medication
app.post("/medication", isloggedin, async (req, res) => {
  const { condition, medicine, dose, time } = req.body;

  if (!condition || !medicine || !dose || !time) {
    req.flash("error", "All fields are required");
    return res.redirect("/home");
  }

  const userId = jwt.verify(req.cookies.token, process.env.JWT_SECRET).id;

  await medicalInfo.create({
    condition,
    medicine,
    dose,
    time,
    user: userId,
  });

  res.redirect("/home");
});

// Add member medication
app.post("/memberMedication", isloggedin, async (req, res) => {
  const { condition, medicine, dose, time, memberId } = req.body;

  if (!condition || !medicine || !dose || !time || !memberId) {
    req.flash("error", "All fields are required");
    return res.redirect(req.get("Referer") || "/home");
  }

  try {
    // Create a new medical record
    const newMemberMedical = await memberMedical.create({
      condition,
      medicine,
      dose,
      time,
      user: req.user._id,
    });

    // Find the member and update their medicalInfo
    const member = await memberModel.findById(memberId);
    if (!member) {
      return res.redirect(req.get("Referer") || "/home");
    }

    member.medicalInfo.push(newMemberMedical._id);
    await member.save();

    res.redirect(`/membersProfile/${memberId}`);
  } catch (error) {
    console.error("Error adding member medication:", error);
    req.flash("error", "Failed to add medical record");
    res.redirect(req.get("Referer") || "/home");
  }
});

// Delete medication
app.get("/delete/:_id", isloggedin, async (req, res) => {
  const id = req.params._id;
  if (await medicalInfo.findByIdAndDelete(id)) {
    req.flash("success", "Medication deleted successfully");
    res.redirect("/home");
  } else {
    await memberMedical.findByIdAndDelete(id);
    res.redirect(req.get("Referer") || "/home");
  }
});

// Add a member
app.post("/addMember", isloggedin, async (req, res) => {
  const { name, proxy, age, gender, phoneNumber, email } = req.body;

  const userId = jwt.verify(req.cookies.token, process.env.JWT_SECRET).id;

  const user = await userModel.findById(userId);
  if (!user) {
    return res.redirect("/home");
  }

  const newMember = await memberModel.create({
    user: user._id,
    name,
    proxy,
    age,
    gender,
    phoneNumber,
    email,
  });
  user.members.push(newMember._id);
  await user.save();

  res.redirect("/home");
});

// Member profile
app.get("/membersProfile/:_id", isloggedin, async (req, res) => {
  try {
    const { _id } = req.params;

    // Find the member and populate their medical conditions
    const member = await memberModel.findById(_id).populate({
      path: "medicalInfo", // Link to MemberMedical model
      model: "MemberMedical",
    });

    if (!member) {
      return res.redirect("/home");
    }

    // Render the EJS view with member and their medical records
    res.render("membersProfile", { member });
  } catch (error) {
    console.error("Error fetching member profile:", error);
    req.flash("error", "Failed to load member profile");
    res.redirect("/home");
  }
});

//Delete Member

app.get("/deleteMember/:_id", isloggedin, async (req, res) => {
  const id = req.params._id;
  if (await memberModel.findByIdAndDelete(id)) {
    res.redirect("/home");
  } else {
    res.redirect(req.get("Referer") || "/home");
  }
});

// Logout
app.get("/logout", (req, res) => {
  res.clearCookie("token");
  req.flash("success", "Logged out successfully");
  res.redirect("/login");
});

// Server setup
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    proxy: {
      type: String,
    },
    age: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    medicalInfo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MemberMedical",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Member", memberSchema);

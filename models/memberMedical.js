const mongoose = require("mongoose");

const memberMedicalSchema = new mongoose.Schema(
  {
    condition: {
      type: String,
      required: true,
    },
    medicine: {
      type: String,
      required: true,
    },
    dose: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MemberMedical", memberMedicalSchema);

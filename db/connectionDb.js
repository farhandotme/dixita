const mongoose = require("mongoose");
const { dbname } = require("../constants");

const connectionDb = async () => {
  try {
    const conn = await mongoose.connect(`${process.env.MONGO_URI}/${dbname}`);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

module.exports = connectionDb;

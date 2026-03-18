const mongoose = require('mongoose');

const mongoDB = process.env.MONGODB_URI;

mongoose.connect(mongoDB)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

module.exports = mongoose;
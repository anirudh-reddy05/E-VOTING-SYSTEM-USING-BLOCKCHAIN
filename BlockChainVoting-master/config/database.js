//Set up mongoose connection
const mongoose = require('mongoose');
const mongoDB = process.env.MONGODB_URI || 'mongodb://localhost/BlockVotes';
mongoose.connect(mongoDB);
module.exports = mongoose;
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const VoterAuditSchema = new Schema({
  email: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  txHash: { type: String, default: '' }
});

const CandidateSchema = new Schema({
  id: { type: Number, required: true },
  name: { type: String, default: '' },
  ipfsHash: { type: String, default: '' },
  votes: { type: Number, default: 0 },
  voters: { type: [VoterAuditSchema], default: [] }
});

const ElectionDataSchema = new Schema({
  election_address: { type: String, required: true, unique: true },
  candidates: { type: [CandidateSchema], default: [] },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ElectionData', ElectionDataSchema);

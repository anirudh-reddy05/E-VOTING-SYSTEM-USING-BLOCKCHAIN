const VoterModel = require('../models/voter');

const bcrypt = require('bcrypt');

const path = require('path');

var nodemailer = require('nodemailer');

const saltRounds = 10;

const ElectionData = require('../models/electionData');

module.exports = {
	create: async function (req, res, cb) {
		try {
			// Check if voter already exists
			const result = await VoterModel.findOne({ 
				email: req.body.email, 
				election_address: req.body.election_address 
			});

			if (result) {
				return res.json({ 
					status: 'error', 
					message: 'Voter already exists', 
					data: null 
				});
			}

			// Create new voter
			const voter = await VoterModel.create({
				email: req.body.email,
				password: req.body.email,
				election_address: req.body.election_address,
			});

			console.log('Voter created:', voter.email);
			
			// Respond immediately - voter is registered
			res.json({
				status: 'success',
				message: 'Voter registered successfully!',
				data: null,
			});

			// Send email asynchronously (non-blocking)
			// Voter is already registered even if email fails
			if (process.env.EMAIL && process.env.EMAIL !== 'your_email@example.com') {
				var transporter = nodemailer.createTransport({
					service: 'gmail',
					auth: {
						user: process.env.EMAIL,
						pass: process.env.PASSWORD,
					},
				});

				const plainTextPassword = req.body.email;

				const mailOptions = {
					from: process.env.EMAIL,
					to: voter.email,
					subject: req.body.election_name || 'Election Notification',
					html:
						(req.body.election_description || 'You have been registered to vote') +
						'<br>Your voting id is: ' +
						voter.email +
						'<br>' +
						'Your password is: ' +
						plainTextPassword +
						'<br><a href="http://localhost:3000/voter_login">Click here to login and vote</a>',
				};

				transporter.sendMail(mailOptions, function (err, info) {
					if (err) {
						console.log('Email sending error:', err.message);
					} else {
						console.log('Email sent successfully to:', voter.email);
					}
				});
			} else {
				console.log('Email not configured. Voter registered but email not sent. Configure EMAIL and PASSWORD in .env file.');
			}
		} catch(e) {
			console.error('Error creating voter:', e.message);
			return res.status(500).json({
				status: 'error',
				message: 'Server error: ' + e.message,
				data: null,
			});
		}
	},

	authenticate: async function (req, res, cb) {
		try {
			console.log('Authenticate request - Email:', req.body.email);
			const voterInfo = await VoterModel.findOne({ email: req.body.email });
			
			if (!voterInfo) {
				console.log('Voter not found for email:', req.body.email);
				return res.json({ status: 'error', message: 'Invalid email/password!!!', data: null });
			}
			
			console.log('Voter found:', voterInfo.email);
			const passwordMatch = bcrypt.compareSync(req.body.password, voterInfo.password);
			console.log('Password match result:', passwordMatch);
			
			if (passwordMatch) {
				console.log('Authentication successful for:', voterInfo.email);
				return res.json({
					status: 'success',
					message: 'voter found!!!',
					data: { id: voterInfo._id, election_address: voterInfo.election_address },
				});
			} else {
				console.log('Password mismatch for voter:', voterInfo.email);
				return res.json({ status: 'error', message: 'Invalid email/password!!!', data: null });
			}
		} catch(e) {
			console.error('Authentication error:', e.message);
			return res.status(500).json({
				status: 'error',
				message: 'Server error: ' + e.message,
				data: null,
			});
		}
	},

	getAll: async function (req, res, cb) {
		try {
			let voterList = [];

			const voters = await VoterModel.find({ election_address: req.body.election_address });
			
			for (let voter of voters) voterList.push({ id: voter._id, email: voter.email });

			count = voterList.length;

			return res.json({
				status: 'success',
				message: 'voters list found!!!',
				data: { voters: voterList },
				count: count,
			});
		} catch(err) {
			return res.status(500).json({
				status: 'error',
				message: 'Database error: ' + err.message,
				data: null,
			});
		}
	},

	// Record a vote server-side (upsert candidate votes for an election)
	recordVote: async function (req, res, cb) {
		try {
			const { election_address, candidateId, candidateName, voter_email, txHash } = req.body;
			if (!election_address || typeof candidateId === 'undefined' || !voter_email) {
				return res.status(400).json({ status: 'error', message: 'Missing parameters', data: null });
			}

			// Atomically mark voter as voted (prevents double-vote race)
			const updatedVoter = await VoterModel.findOneAndUpdate(
				{ email: voter_email, election_address: election_address, hasVoted: { $ne: true } },
				{ $set: { hasVoted: true } },
				{ new: true }
			);

			if (!updatedVoter) {
				return res.status(400).json({ status: 'error', message: 'Voter not found or already voted', data: null });
			}

			// Find or create election data and increment candidate votes + record audit
			let ed = await ElectionData.findOne({ election_address: election_address });
			if (!ed) {
				ed = await ElectionData.create({ election_address: election_address, candidates: [] });
			}

			const cid = parseInt(candidateId, 10);
			let candIndex = ed.candidates.findIndex(c => c.id === cid);
			if (candIndex === -1) {
				ed.candidates.push({ id: cid, name: candidateName || `Candidate ${cid}`, votes: 1, voters: [{ email: voter_email, txHash: txHash || '' }] });
			} else {
				// increment votes and push audit entry
				ed.candidates[candIndex].votes = (ed.candidates[candIndex].votes || 0) + 1;
				if (candidateName) ed.candidates[candIndex].name = candidateName;
				ed.candidates[candIndex].voters.push({ email: voter_email, txHash: txHash || '' });
			}

			ed.updatedAt = new Date();
			await ed.save();

			return res.json({ status: 'success', message: 'Vote recorded', data: { candidates: ed.candidates } });
		} catch(err) {
			console.error('recordVote error:', err.message);
			return res.status(500).json({ status: 'error', message: 'Server error: ' + err.message, data: null });
		}
	},

	// Return stored votes for an election
	getVotes: async function (req, res, cb) {
		try {
			const election_address = req.body.election_address || req.query.election_address;
			if (!election_address) return res.status(400).json({ status: 'error', message: 'Missing election_address', data: null });

			const ed = await ElectionData.findOne({ election_address: election_address });
			if (!ed) return res.json({ status: 'success', message: 'No data', data: { candidates: [] } });

			return res.json({ status: 'success', message: 'Data found', data: { candidates: ed.candidates } });
		} catch(err) {
			console.error('getVotes error:', err.message);
			return res.status(500).json({ status: 'error', message: 'Server error: ' + err.message, data: null });
		}
	},

	// Reset a voter's vote (admin use) - decrement candidate votes and clear hasVoted
	resetVote: async function (req, res, cb) {
		try {
			const { election_address, voter_email } = req.body;
			if (!election_address || !voter_email) return res.status(400).json({ status: 'error', message: 'Missing parameters', data: null });

			const ed = await ElectionData.findOne({ election_address: election_address });
			if (!ed) return res.status(404).json({ status: 'error', message: 'Election data not found', data: null });

			// Find and remove voter from candidate voters and decrement votes
			let modified = false;
			for (let c of ed.candidates) {
				const idx = c.voters.findIndex(v => v.email === voter_email);
				if (idx !== -1) {
					c.voters.splice(idx, 1);
					c.votes = Math.max(0, (c.votes || 1) - 1);
					modified = true;
					break;
				}
			}

			if (modified) {
				ed.updatedAt = new Date();
				await ed.save();
				// clear voter's flag
				await VoterModel.findOneAndUpdate({ email: voter_email, election_address: election_address }, { $set: { hasVoted: false } });
				return res.json({ status: 'success', message: 'Vote reset', data: null });
			}

			return res.status(404).json({ status: 'error', message: 'Voter vote not found in election data', data: null });
		} catch(err) {
			console.error('resetVote error:', err.message);
			return res.status(500).json({ status: 'error', message: 'Server error: ' + err.message, data: null });
		}
	},

	// Update transaction hash for an existing recorded vote (attach txHash to voter audit)
	updateTx: async function (req, res, cb) {
		try {
			const { election_address, voter_email, txHash } = req.body;
			if (!election_address || !voter_email || !txHash) return res.status(400).json({ status: 'error', message: 'Missing parameters', data: null });

			const ed = await ElectionData.findOne({ election_address: election_address });
			if (!ed) return res.status(404).json({ status: 'error', message: 'Election data not found', data: null });

			let updated = false;
			for (let c of ed.candidates) {
				for (let v of c.voters) {
					if (v.email === voter_email && (!v.txHash || v.txHash.length === 0)) {
						v.txHash = txHash;
						updated = true;
						break;
					}
				}
				if (updated) break;
			}

			if (updated) {
				ed.updatedAt = new Date();
				await ed.save();
				return res.json({ status: 'success', message: 'txHash updated', data: null });
			}

			return res.status(404).json({ status: 'error', message: 'Voter audit entry not found', data: null });
		} catch(err) {
			console.error('updateTx error:', err.message);
			return res.status(500).json({ status: 'error', message: 'Server error: ' + err.message, data: null });
		}
	},

	updateById: async function (req, res, cb) {
		try {
			const result = await VoterModel.findOne({ email: req.body.email });
			
			if (result) {
				return res.json({ status: 'error', message: 'Voter already exists', data: null });
			}

			const password = bcrypt.hashSync(req.body.email, 10);
			
			await VoterModel.findByIdAndUpdate(
				req.params.voterId,
				{ email: req.body.email, password: password }
			);

			const voterInfo = await VoterModel.findById(req.params.voterId);

			if (!voterInfo) {
				return res.status(500).json({ status: 'error', message: 'Voter not found', data: null });
			}

			var transporter = nodemailer.createTransport({
				service: 'gmail',
				auth: {
					user: process.env.EMAIL,
					pass: process.env.PASSWORD,
				},
			});

			const mailOptions = {
				from: process.env.EMAIL,
				to: voterInfo.email,
				subject: req.body.election_name,
				html:
					req.body.election_description +
					'<br>Your voting id is:' +
					voterInfo.email +
					'<br>' +
					'Your password is:' +
					voterInfo.password +
					'<br><a href="url">Click here to visit the website</a>',
			};

			transporter.sendMail(mailOptions, function (err, info) {
				if (err) {
					console.log(err);
				} else {
					console.log(info);
				}
			});

			return res.json({
				status: 'success',
				message: 'Voter updated successfully!!!',
				data: null,
			});
		} catch(err) {
			return res.status(500).json({
				status: 'error',
				message: 'Server error: ' + err.message,
				data: null,
			});
		}
	},

	deleteById: async function (req, res, cb) {
		try {
			await VoterModel.findByIdAndDelete(req.params.voterId);
			return res.json({ status: 'success', message: 'voter deleted successfully!!!', data: null });
		} catch(err) {
			return res.status(500).json({
				status: 'error',
				message: 'Server error: ' + err.message,
				data: null,
			});
		}
	},

	resultMail: async function (req, res, cb) {
		try {
			const voters = await VoterModel.find({ election_address: req.body.election_address });
			
			const election_name = req.body.election_name;
			const winner_candidate = req.body.winner_candidate;

			for (let voter of voters) {
				var transporter = nodemailer.createTransport({
					service: 'gmail',
					auth: {
						user: process.env.EMAIL,
						pass: process.env.PASSWORD,
					},
				});

				const mailOptions = {
					from: process.env.EMAIL,
					to: voter.email,
					subject: election_name + ' results',
					html:
						'The results of ' +
						election_name +
						' are out.<br>The winner candidate is: <b>' +
						winner_candidate +
						'</b>.',
				};

				transporter.sendMail(mailOptions, function (err, info) {
					if (err) {
						console.log(err);
					} else {
						console.log(info);
					}
				});
			}

			var transporter = nodemailer.createTransport({
				service: 'gmail',
				auth: {
					user: process.env.EMAIL,
					pass: process.env.PASSWORD,
				},
			});

			const mailOptions = {
				from: process.env.EMAIL,
				to: req.body.candidate_email,
				subject: req.body.election_name + ' results !!!',
				html: 'Congratulations you won ' + req.body.election_name + ' election.',
			};

			transporter.sendMail(mailOptions, function (err, info) {
				if (err) {
					console.log(err);
				} else {
					console.log(info);
				}
			});

			return res.json({ status: 'success', message: 'mails sent successfully!!!', data: null });
		} catch(err) {
			return res.status(500).json({
				status: 'error',
				message: 'Database error: ' + err.message,
				data: null,
			});
		}
	},

	getElections: async function (req, res, cb) {
		try {
			const voterEmail = req.body.email;
			
			if (!voterEmail) {
				return res.status(400).json({
					status: 'error',
					message: 'Email is required',
					data: null,
				});
			}

			// Find all elections this voter is registered for
			const voterRecords = await VoterModel.find({ email: voterEmail });
			
			if (!voterRecords || voterRecords.length === 0) {
				return res.json({
					status: 'success',
					message: 'No elections found',
					data: { elections: [] },
				});
			}

			// Extract unique election addresses and try to get their details from localStorage or memory
			const electionsMap = {};
			for (let record of voterRecords) {
				if (record.election_address && !electionsMap[record.election_address]) {
					electionsMap[record.election_address] = {
						address: record.election_address,
						name: 'Election ' + record.election_address.substring(0, 6),
						description: 'Blockchain Election',
					};
				}
			}

			const elections = Object.values(electionsMap);

			return res.json({
				status: 'success',
				message: 'Elections found',
				data: { elections: elections },
			});
		} catch(err) {
			console.error('Error fetching elections:', err.message);
			return res.status(500).json({
				status: 'error',
				message: 'Server error: ' + err.message,
				data: null,
			});
		}
	},
};

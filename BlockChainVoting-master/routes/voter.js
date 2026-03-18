const express = require('express');
const router = express.Router();
const voterController = require('../controllers/voter');

router.post('/authenticate', voterController.authenticate);
router.post('/register', voterController.create);
router.post('/record_vote', voterController.recordVote);
router.post('/get_votes', voterController.getVotes);
router.post('/reset_vote', voterController.resetVote);
router.post('/update_tx', voterController.updateTx);
router.post('/elections', voterController.getElections);
router.post('/resultMail', voterController.resultMail);
router.post('/', voterController.getAll);
router.put('/:voterId', voterController.updateById);
router.delete('/:voterId', voterController.deleteById);

module.exports = router;
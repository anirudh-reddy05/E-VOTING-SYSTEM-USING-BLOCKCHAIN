import React, { Component } from 'react';
import { Grid, Button, Header, Icon, Image, Menu, Sidebar, Container, Card } from 'semantic-ui-react';
import Layout from '../../components/Layout'; 
import web3 from '../../Ethereum/web3';
import Election from '../../Ethereum/election';
import Cookies from 'js-cookie';
import {Router} from '../../routes';
import {Helmet} from 'react-helmet';

class VotingList extends Component {

    state = {
        numCand: '',
        election_address: Cookies.get('address') || '',
        election_name: 'Loading...',
        election_description: 'Please wait',
        candidates: [],
        cand_name: '',
        cand_desc: '',
        buffer: '',
        ipfsHash: null,
        loading: false,
        votingCandidateId: null,
        votedCandidateId: null,
        voteSuccess: false,
        item: [],
        candidateSource: []
    };
    
    rebuildItems = (candidates) => {
        const items = (candidates || []).map((candidate, i) => {
            const candIndex = candidate.id || i;
            const isVoting = this.state.votingCandidateId === candIndex;
            const isVoted = this.state.votedCandidateId === candIndex;
            return {
                header: candidate.name || `Candidate ${candIndex + 1}`,
                description: candidate.description || candidate.desc || 'No description',
                image: candidate.ipfsHash ? (
                    <Image key={`img-${candIndex}`} id={candIndex} src={`https://ipfs.io/ipfs/${candidate.ipfsHash}`} style={{maxWidth: '100%',maxHeight:'190px'}}/>
                ) : null,
                extra: (
                    <div>
                        <Icon name='pie graph' size='big' iconPostion='left'/>  
                        {(candidate.votes || candidate.count || 0).toString()}  
                        <Button 
                            id={candIndex} 
                            style={{float: 'right'}} 
                            onClick={this.vote} 
                            primary
                            loading={isVoting}
                            disabled={isVoting || isVoted}
                            content={isVoted ? '✓ Voted' : 'Vote!'}
                        />
                    </div>
                )
            };
        });
        this.setState({ item: items });
    }
    GridExampleGrid = () => <Grid>{columns}</Grid>
    SidebarExampleVisible = () => (
  
      <Sidebar.Pushable>
        <Sidebar as={Menu} animation='overlay' icon='labeled' inverted vertical visible width='thin' style={{ backgroundColor: 'white', borderWidth: "10px" }}>
        <Menu.Item as='a' style={{ color: 'grey' }} >
        <h2>MENU</h2><hr/>
        </Menu.Item>
          <Menu.Item as='a' style={{ color: 'grey' }} >
            <Icon name='dashboard' />
            Dashboard
            </Menu.Item>
          <hr/>
          <Button onClick={this.signOut} style={{backgroundColor: 'white'}}>
          <Menu.Item as='a' style={{ color: 'grey' }}>
            <Icon name='sign out' />
            Sign Out
          </Menu.Item>
            </Button>
        </Sidebar>
      </Sidebar.Pushable>
    )

    signOut() {
          Cookies.remove('address');
          Cookies.remove('voter_email');
          alert("Logging out.");
          Router.pushRoute('/homepage');
    }

    async componentDidMount() {
        try {                               
            console.log('Vote page mounted');
            
            // Get address from cookie
            const add = Cookies.get('address');
            console.log('Election address from cookie:', add);
            
            if (!add) {
                console.error('No election address found');
                alert("No election address found. Please login again.");
                Router.pushRoute('/voter_login');
                return;
            }
            
            // Initialize election object - with better error handling
            let election;
            let blockchainAvailable = true;
            
            try {
                console.log('Creating election contract instance...');
                election = Election(add);
                console.log('Election object created successfully');
                
                // Test if blockchain is actually reachable
                try {
                    const test = await election.methods.getElectionDetails().call();
                    console.log('Blockchain connection verified, election details:', test);
                } catch(testErr) {
                    console.warn('Blockchain test failed:', testErr.message);
                    blockchainAvailable = false;
                }
            } catch(electionCreateErr) {
                console.error('Failed to create election object:', electionCreateErr.message);
                blockchainAvailable = false;
                
                // Create a mock election object for development
                election = {
                    methods: {
                        getElectionDetails: () => ({ call: () => Promise.resolve(['Mock Election', 'Development Mode']) }),
                        getNumOfCandidates: () => ({ call: () => Promise.resolve(0) }),
                        getCandidate: (id) => ({ call: () => Promise.resolve(null) })
                    }
                };
                console.log('Using mock election object for development');
            }
            
            // Get election details
            let summary = ['Election', 'Voting Open'];
            try {
                if (blockchainAvailable) {
                    summary = await election.methods.getElectionDetails().call();
                    console.log('Election details loaded:', summary);
                } else {
                    console.warn('Blockchain unavailable, using defaults');
                    summary = ['Election', 'Voting is now open'];
                }
            } catch(blockchainErr) {
                console.warn("Could not fetch blockchain details:", blockchainErr.message);
                summary = ['Election', 'Voting is now open'];
            }
            
            // Update state with election details
            this.setState({
                election_name: summary[0] || 'Election',
                election_description: summary[1] || 'Cast your vote'
            });            
            
            // Load candidates
            try {
                let c = 0;
                let items = [];
                
                // First, try to load from localStorage (local storage has latest data)
                console.log('Loading candidates - checking localStorage first...');
                const storedElection = localStorage.getItem(`election_${add}`);
                if (storedElection) {
                    try {
                        const electionData = JSON.parse(storedElection);
                        if (electionData.candidates && electionData.candidates.length > 0) {
                            console.log('Candidates found in localStorage:', electionData.candidates.length);
                            
                            let i = -1;
                            items = electionData.candidates.map(candidate => {
                                i++;
                                const candIndex = i;
                                const isVoting = this.state.votingCandidateId === candIndex;
                                const isVoted = this.state.votedCandidateId === candIndex;
                                
                                return {
                                    header: candidate.name || `Candidate ${candIndex + 1}`,
                                    description: candidate.description || 'No description',
                                    image: candidate.ipfsHash ? (
                                        <Image key={`img-${candIndex}`} id={candIndex} src={`https://ipfs.io/ipfs/${candidate.ipfsHash}`} style={{maxWidth: '100%',maxHeight:'190px'}}/>
                                    ) : null,
                                    extra: (
                                        <div>
                                            <Icon name='pie graph' size='big' iconPostion='left'/>  
                                            {candidate.votes || '0'}  
                                            <Button 
                                                id={candIndex} 
                                                style={{float: 'right'}} 
                                                onClick={this.vote} 
                                                primary
                                                loading={isVoting}
                                                disabled={isVoting || isVoted}
                                                content={isVoted ? '✓ Voted' : 'Vote!'}
                                            />
                                        </div>
                                    ) 
                                };
                            });
                            
                            this.setState({item: items});
                                console.log('State updated with localStorage candidates');
                                // store raw candidate source and rebuild items dynamically
                                const candidatesNormalized = electionData.candidates.map((c, idx) => ({ id: idx, name: c.name, description: c.description, ipfsHash: c.ipfsHash, votes: parseInt(c.votes || 0, 10) }));
                                this.setState({ candidateSource: candidatesNormalized }, () => {
                                    this.rebuildItems(this.state.candidateSource);
                                });
                                console.log('State updated with localStorage candidates');
                            return; // Exit early - we have candidates
                        }
                    } catch(parseErr) {
                        console.warn('Error parsing localStorage candidates:', parseErr.message);
                    }
                }
                
                console.log('No localStorage candidates, attempting blockchain fetch...');
                
                // Try to get number of candidates from blockchain
                try {
                    console.log('Attempting to get candidate count from blockchain');
                    let candidateCountMethod = election.methods.getNumOfCandidates;
                    
                    // Handle different method signatures
                    let countResult;
                    if (typeof candidateCountMethod === 'function') {
                        countResult = await candidateCountMethod().call();
                    } else if (typeof candidateCountMethod === 'object' && candidateCountMethod.call) {
                        countResult = await candidateCountMethod.call();
                    }
                    
                    c = parseInt(countResult, 10) || 0;
                    console.log('Candidate count from blockchain:', c);
                } catch(numErr1) {
                    console.warn("Could not get candidate count:", numErr1.message);
                    c = 0;
                }
                
                if(c > 0) {
                    console.log('Fetching', c, 'candidates from blockchain');
                    // Fetch all candidates in parallel
                    const candidatePromises = [];
                    for(let i=0; i<c; i++) {
                        candidatePromises.push(
                            election.methods.getCandidate(i).call()
                                .then(data => {
                                    console.log(`Candidate ${i} loaded from blockchain`);
                                    return data;
                                })
                                .catch(err => {
                                    console.warn(`Failed to fetch candidate ${i}:`, err.message);
                                    return null;
                                })
                        );
                    }
                    
                    const candidates = await Promise.all(candidatePromises);
                    console.log('All candidates fetched from blockchain:', candidates.length);
                    
                    let validCandidateIndex = -1;
                    items = candidates
                        .map(candidate => {
                            validCandidateIndex++;
                            if(!candidate) return null;
                            
                            const candIndex = validCandidateIndex;
                            const isVoting = this.state.votingCandidateId === candIndex;
                            const isVoted = this.state.votedCandidateId === candIndex;
                            
                            return {
                              header: candidate[0] || `Candidate ${candIndex + 1}`,
                              description: candidate[1] || 'No description',
                              image: candidate[2] ? (
                                  <Image key={`img-${candIndex}`} id={candIndex} src={`https://ipfs.io/ipfs/${candidate[2]}`} style={{maxWidth: '100%',maxHeight:'190px'}}/>
                                ) : null,
                              extra: (
                                  <div>
                                    <Icon name='pie graph' size='big' iconPostion='left'/>  
                                    {candidate[3] ? candidate[3].toString() : '0'}  
                                    <Button 
                                      id={candIndex} 
                                      style={{float: 'right'}} 
                                      onClick={this.vote} 
                                      primary
                                      loading={isVoting}
                                      disabled={isVoting || isVoted}
                                      content={isVoted ? '✓ Voted' : 'Vote!'}
                                    />
                                </div>
                              ) 
                            };
                        })
                        .filter(item => item !== null);
                    
                    console.log('Final items prepared from blockchain:', items.length);
                } else {
                    console.warn("No candidates available - showing placeholder");
                    items = [{
                        header: 'No candidates yet',
                        description: 'Candidates will appear here once they are added by the administrator',
                        extra: <div style={{color: '#999'}}>Waiting for candidates...</div>
                    }];
                }
                
                this.setState({item: items});
                console.log('State updated successfully');
                // ensure items reflect current candidateSource
                if (!this.state.item || this.state.item.length === 0) this.rebuildItems(this.state.candidateSource);
                
                // After initial load, check server-side votes to detect if this voter already voted
                try {
                    const voterEmail = Cookies.get('voter_email');
                    if (voterEmail) {
                        const resp = await fetch('/voter/get_votes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ election_address: Cookies.get('address') }) });
                        const json = await resp.json();
                        if (json && json.status === 'success' && json.data && Array.isArray(json.data.candidates)) {
                            let found = null;
                            for (const c of json.data.candidates) {
                                if (Array.isArray(c.voters)) {
                                    const match = c.voters.find(v => v.email === voterEmail);
                                    if (match) { found = c.id; break; }
                                }
                            }
                            if (found !== null) {
                                this.setState({ votedCandidateId: found }, () => this.rebuildItems(this.state.candidateSource));
                                console.log('Voter already voted for candidate:', found);
                            }
                        }
                    }
                } catch(e) {
                    console.warn('Could not verify server vote status:', e.message);
                }
                
            } catch(loadErr) {
                console.error("Error loading candidates:", loadErr.message);
                this.setState({item: [{
                    header: 'No candidates available',
                    description: 'Please check back later',
                    extra: null
                }]});
            }
            
            console.log('componentDidMount completed successfully');
            
        } catch(err) {
            console.error("Unexpected error in componentDidMount:", err);
            // Show a user-friendly message but don't hide the page
            this.setState({
                election_name: 'Election',
                election_description: 'Voting Page',
                item: [{
                    header: 'Welcome',
                    description: 'Candidates will appear here',
                    extra: null
                }]
            });
        }
    }
    getElectionDetails = () => {
        const {
            election_name,
            election_description
        } = this.state;
    
        return (
          <div style={{marginLeft: '45%',marginBottom: '2%',marginTop: '2%'}}>
            <Header as="h2">
              <Icon name="address card" />
              <Header.Content>
                {election_name}
                <Header.Subheader>{election_description}</Header.Subheader>
              </Header.Content>
            </Header>
          </div>
        );
      }

    renderTable = () => {
        return (<Card.Group items={this.state.item}/>)
    }

    vote = async event => {
        console.log('=== VOTE METHOD CALLED ===');
        console.log('Event:', event);
        
        try {
            const candidateId = parseInt(event.currentTarget.id, 10);
            console.log('1. Candidate ID parsed:', candidateId);
            
            // Show loading state immediately
            this.setState({ votingCandidateId: candidateId });
            console.log('2. Loading state set');
            
            // Get cookies
            const add = Cookies.get('address');
            const voterEmail = Cookies.get('voter_email');
            
            console.log('3. Cookies retrieved:', { 
                address: add ? 'EXISTS' : 'MISSING',
                voterEmail: voterEmail ? 'EXISTS' : 'MISSING'
            });
            
            if (!add || !voterEmail) {
                console.error('ERROR: Missing required cookies');
                this.setState({ votingCandidateId: null });
                alert('Session expired. Please login again.');
                Router.pushRoute('/voter_login');
                return;
            }
            
            console.log('4. Attempting to vote for candidate:', candidateId);
            
            // Try to get web3 accounts, but don't fail if we can't
            let accounts = [];
            let account = '0x0';
            try {
                accounts = await web3.eth.getAccounts();
                account = accounts && accounts.length > 0 ? accounts[0] : '0x0';
                console.log('5. Web3 accounts retrieved:', account);
            } catch(accountErr) {
                console.warn('5. WARNING: Could not get web3 accounts:', accountErr.message);
                // Continue with 0x0 address
            }
            
            // Initialize election object
            let election;
            let blockchainAvailable = true;
            try {
                election = Election(add);
                console.log('6. Election contract initialized');
            } catch(electionErr) {
                console.error('6. WARNING: Failed to initialize election contract:', electionErr.message);
                blockchainAvailable = false;
                console.log('6a. Continuing with local-only vote (blockchain unavailable)');
            }
            
            // Try to send vote to blockchain, but don't fail if we can't
            if (blockchainAvailable) {
                try {
                    console.log('7. Attempting blockchain vote...');
                    const tx = election.methods.vote(candidateId, voterEmail).send({
                        from: account,
                        gasPrice: '1000000000',
                        gas: 100000
                    });
                    
                    // Handle transaction events asynchronously
                    tx.on('transactionHash', (hash) => {
                        console.log('7a. Vote transaction sent:', hash);
                        // attach txHash to server-side record (if recorded locally already)
                        try {
                            fetch('/voter/update_tx', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ election_address: add, voter_email: voterEmail, txHash: hash })
                            }).then(r => r.json()).then(j => console.log('update_tx response', j)).catch(e => console.warn('update_tx failed', e.message));
                        } catch(e) {
                            console.warn('Could not call update_tx:', e.message);
                        }
                    })
                    .on('confirmation', (confirmationNumber) => {
                        console.log('7b. Confirmation:', confirmationNumber);
                    })
                    .on('error', (error) => {
                        console.warn('7c. Transaction error (non-critical):', error.message);
                    });
                } catch (blockchainErr) {
                    console.warn('7. WARNING: Blockchain vote not available:', blockchainErr.message);
                    // Continue - vote is still recorded locally
                }
            } else {
                console.log('7. Skipping blockchain vote - blockchain unavailable');
            }
            
            // Record vote locally regardless of blockchain status
            console.log('8. Recording vote locally for candidate:', candidateId);
            this.setState({ 
                votedCandidateId: candidateId,
                votingCandidateId: null,
                voteSuccess: true
            });
            
            console.log('9. Vote successfully recorded');
            
            // Show success message
            alert('Vote recorded! Thank you for voting.');

            // Persist vote into localStorage so admin/dashboard can reflect it when blockchain isn't updated
            try {
                const storageKey = `election_${add}`;
                const stored = localStorage.getItem(storageKey);
                if (stored) {
                    const electionData = JSON.parse(stored);
                    if (electionData.candidates && electionData.candidates.length > candidateId) {
                        // Ensure votes field exists and increment
                        electionData.candidates[candidateId].votes = (parseInt(electionData.candidates[candidateId].votes || 0, 10) + 1).toString();
                        localStorage.setItem(storageKey, JSON.stringify(electionData));
                        console.log('LocalStorage updated for', storageKey, electionData.candidates[candidateId]);
                    }
                }
            } catch (lsErr) {
                console.warn('Could not update localStorage with vote:', lsErr.message);
            }

            // Send vote to server for persistent storage (so admin dashboard can read authoritative counts)
            try {
                fetch('/voter/record_vote', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ election_address: add, candidateId: candidateId, candidateName: this.state.item && this.state.item[candidateId] ? (this.state.item[candidateId].header || null) : null, voter_email: voterEmail })
                }).then(res => res.json()).then(json => {
                    if (json && json.status === 'success') {
                        console.log('Server recorded vote:', json.data && json.data.candidates ? json.data.candidates[candidateId] : null);
                    } else {
                        console.warn('Server did not record vote:', json && json.message);
                    }
                }).catch(err => console.warn('Error sending vote to server:', err.message));
            } catch(postErr) {
                console.warn('Could not send vote to server:', postErr.message);
            }
            
            // Redirect to elections list after a short delay
            console.log('10. Redirecting to elections list...');
            setTimeout(() => {
                Router.pushRoute('/election/select_election');
            }, 2000);
            
        } catch (err) {
            console.error('=== VOTE ERROR ===');
            console.error('Error:', err);
            console.error('Stack:', err.stack);
            this.setState({ votingCandidateId: null });
            alert('Error recording vote: ' + (err.message || 'Unknown error'));
        }
    }
  
    render() {
      return (
        <div> 
            <Helmet>
            <title>Vote</title>
            <link rel="shortcut icon" type="image/x-icon" href="../../static/logo3.png" />
          </Helmet>
          <Grid>
            <Grid.Row>
              <Grid.Column width={2}>
                {this.SidebarExampleVisible()}
              </Grid.Column>
              <Layout>                                   
              {this.getElectionDetails()}
              <Grid.Column style={{minHeight: '77vh',marginLeft: '10%'}}>
              <Container>
                       {this.renderTable()}
                    </Container>
              </Grid.Column>      
              </Layout>
            </Grid.Row>
          </Grid>
        </div>
      );
    }
  }
  

export default VotingList
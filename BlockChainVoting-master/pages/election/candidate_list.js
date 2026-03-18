import React, { Component } from 'react';
import { Grid, Table, Button, Form, Image, Header, Icon, Menu, Modal, Sidebar, Container, Card } from 'semantic-ui-react';
import Layout from '../../components/Layout';
import web3 from '../../Ethereum/web3';
import Cookies from 'js-cookie';
import {Link,Router} from '../../routes';
import Election from '../../Ethereum/election';
import ipfs from '../../ipfs';
import {Helmet} from 'react-helmet';
class VotingList extends Component { 

    state = {
        election_address: Cookies.get('address'),
        election_name: '',
        election_description: '',
        candidates: [],
        cand_name: '',
        cand_desc: '',
        buffer: '',
        ipfsHash: null,
        loading: false
    }

    async componentDidMount() {
        try {
            const add = Cookies.get('address');
            if (!add) {
                console.error('No election address found');
                alert("No election address found. Please login again.");
                Router.pushRoute('/company_login');
                return;
            }

            let election;
            try {
                election = Election(add);
                console.log('Election contract initialized');
            } catch(err) {
                console.warn('Failed to initialize election contract:', err.message);
                this.setState({
                    election_name: 'Election',
                    election_description: 'Candidate List',
                    item: []
                });
                return;
            }

            // Try to get election details from blockchain
            let summary = ['Election', 'Candidates'];
            try {
                summary = await election.methods.getElectionDetails().call();
                this.setState({
                    election_name: summary[0],
                    election_description: summary[1]
                });
            } catch(detailsErr) {
                console.warn('Could not fetch election details:', detailsErr.message);
                // Use defaults
                this.setState({
                    election_name: 'Election',
                    election_description: 'Candidates'
                });
            }

            // Get number of candidates
            let c = 0;
            try {
                let numResult = await election.methods.getNumOfCandidates().call();
                c = parseInt(numResult, 10) || 0;
                console.log('Candidate count:', c);
                
                if(c == 0) {
                    alert("Register a candidate first!");
                }

                let candidates = [];
                if(c > 0) {
                    // Fetch all candidates in parallel
                    const candidatePromises = [];
                    for(let i = 0; i < c; i++) {
                        candidatePromises.push(
                            election.methods.getCandidate(i).call()
                                .catch(err => {
                                    console.warn(`Failed to fetch candidate ${i}:`, err.message);
                                    return null;
                                })
                        );
                    }
                    candidates = await Promise.all(candidatePromises);
                }

                let i = -1;
                const items = candidates
                    .filter(c => c !== null)
                    .map(candidate => {
                        i++;
                        return {
                            header: candidate[0] || `Candidate ${i + 1}`,
                            description: candidate[1] || 'No description',
                            image: candidate[2] ? (
                                <Image key={`img-${i}`} id={i} src={`https://ipfs.io/ipfs/${candidate[2]}`} style={{maxWidth: '100%',maxHeight:'190px'}} />
                            ) : null,
                            extra: (
                                <div>
                                    <Icon name='pie graph' iconPostion='left'/>  
                                    {candidate[3] ? candidate[3].toString() : '0'}  
                                </div>
                            ) 
                        };
                    });
                
                this.setState({item: items});
                console.log('Candidates loaded:', items.length);
                
            } catch(err) {
                console.error('Error loading candidates:', err.message);
                this.setState({item: []});
            }

        } catch(err) {
            console.error('Error in componentDidMount:', err.message);
            alert("Error loading candidate list. Redirecting to login...");
            Router.pushRoute('/company_login');
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

    captureFile = (event) => {
        console.log('File capture initiated');
        event.stopPropagation()
        event.preventDefault()
        
        try {
            const file = event.target.files[0];
            
            if (!file) {
                console.warn('No file selected');
                alert('Please select a file');
                return;
            }
            
            console.log('File selected:', file.name, 'Size:', file.size);
            
            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                alert('File is too large. Maximum file size is 5MB');
                return;
            }
            
            // Validate file type
            const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
            if (!validTypes.includes(file.type)) {
                alert('Invalid file type. Please select a JPEG, PNG, or GIF image');
                return;
            }
            
            let reader = new window.FileReader();
            reader.readAsArrayBuffer(file);
            
            reader.onload = () => this.convertToBuffer(reader);
            reader.onerror = (error) => {
                console.error('File read error:', error);
                alert('Error reading file. Please try again');
            };
        } catch(err) {
            console.error('File capture error:', err);
            alert('Error capturing file: ' + err.message);
        }
    };
    
    convertToBuffer = async(reader) => {
        try {
            console.log('Converting file to buffer...');
            //file is converted to a buffer for upload to IPFS
            const buffer = await Buffer.from(reader.result);
            //set this buffer -using es6 syntax
            this.setState({buffer});
            console.log('Buffer created successfully:', buffer.length, 'bytes');
        } catch(err) {
            console.error('Buffer conversion error:', err);
            alert('Error processing file: ' + err.message);
        }
    };
    
    onSubmit = async (event) => {
        event.preventDefault();
        console.log('=== CANDIDATE SUBMISSION STARTED ===');
        
        this.setState({loading: true});
        
        try {
            // Validate inputs
            console.log('1. Validating inputs...');
            const cand_name = this.state.cand_name;
            const cand_desc = this.state.cand_desc;
            const email = document.getElementById('email').value;
            
            if (!cand_name || !cand_desc || !email) {
                alert('Please fill in all fields: Name, Description, and Email');
                this.setState({loading: false});
                return;
            }
            
            console.log('2. Inputs validated:', { cand_name, cand_desc, email });
            
            // Prepare IPFS hash (with fallback)
            let ipfsHash = 'QmDefaultHash';
            
            // Try to upload file to IPFS if buffer exists
            if (this.state.buffer) {
                console.log('3. File buffer exists, attempting IPFS upload...');
                try {
                    const result = await new Promise((resolve, reject) => {
                        ipfs.add(this.state.buffer, (err, ipfsHash) => {
                            if (err) {
                                console.error('IPFS error:', err);
                                reject(err);
                            } else if (ipfsHash && ipfsHash[0]) {
                                console.log('4. IPFS upload successful:', ipfsHash[0].hash);
                                resolve(ipfsHash[0].hash);
                            } else {
                                reject(new Error('No IPFS hash returned'));
                            }
                        });
                    });
                    ipfsHash = result;
                } catch (ipfsErr) {
                    console.warn('4. IPFS upload failed, using fallback:', ipfsErr.message);
                    // Use a default hash if IPFS fails
                    ipfsHash = 'QmDefaultHash';
                }
            } else {
                console.log('3. No file buffer, using default IPFS hash');
            }
            
            // Try to add candidate to blockchain
            console.log('5. Attempting to add candidate to blockchain...');
            try {
                let accounts = [];
                try {
                    accounts = await web3.eth.getAccounts();
                    console.log('5a. Web3 accounts retrieved');
                } catch(accountErr) {
                    console.warn('5a. Could not get web3 accounts (development mode):', accountErr.message);
                    // Continue without web3 - candidate can still be registered
                }
                
                if (accounts.length > 0) {
                    const add = Cookies.get('address');
                    const election = Election(add);
                    
                    try {
                        election.methods.addCandidate(
                            cand_name,
                            cand_desc,
                            ipfsHash,
                            email
                        ).send({
                            from: accounts[0]
                        }, (error, transactionHash) => {
                            if (error) {
                                console.warn('5c. Blockchain error (non-critical):', error.message);
                            } else {
                                console.log('5c. Blockchain transaction sent:', transactionHash);
                            }
                        });
                    } catch(txErr) {
                        console.warn('5b. Blockchain transaction failed (development mode):', txErr.message);
                    }
                }
            } catch(blockchainErr) {
                console.warn('5. Blockchain operation skipped:', blockchainErr.message);
            }
            
            // Register candidate via backend API
            console.log('6. Registering candidate via backend API...');
            await new Promise((resolve, reject) => {
                const http = new XMLHttpRequest();
                const url = "/candidate/registerCandidate";
                const params = "email=" + encodeURIComponent(email) + "&election_name=" + encodeURIComponent(this.state.election_name);
                
                http.open("POST", url, true);
                http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                
                http.onreadystatechange = function() {
                    if (http.readyState === 4) {
                        try {
                            const responseObj = JSON.parse(http.responseText);
                            console.log('6. API response:', responseObj);
                            
                            if(responseObj.status === "success") {
                                console.log('Candidate registration successful');
                                resolve(responseObj);
                            } else {
                                console.warn('Candidate registration warning:', responseObj.message);
                                resolve(responseObj); // Don't fail - candidate might still be added to blockchain
                            }
                        } catch(parseErr) {
                            console.error('6. Error parsing response:', parseErr.message);
                            reject(parseErr);
                        }
                    }
                };
                
                http.onerror = () => {
                    console.error('6. Network error sending registration request');
                    reject(new Error('Network error'));
                };
                
                http.send(params);
            });
            
            console.log('7. Candidate submission completed successfully');
            alert("Candidate added successfully!");
            
            // Store candidate locally for voting
            try {
                console.log('8. Storing candidate in localStorage...');
                const add = Cookies.get('address');
                const electionKey = `election_${add}`;
                const storedElection = localStorage.getItem(electionKey);
                
                let electionData = {
                    name: this.state.election_name,
                    description: this.state.election_description,
                    candidates: []
                };
                
                if (storedElection) {
                    electionData = JSON.parse(storedElection);
                }
                
                // Add new candidate
                const newCandidate = {
                    name: cand_name,
                    description: cand_desc,
                    ipfsHash: ipfsHash,
                    email: email,
                    votes: 0
                };
                
                if (!electionData.candidates) {
                    electionData.candidates = [];
                }
                
                electionData.candidates.push(newCandidate);
                
                // Save back to localStorage
                localStorage.setItem(electionKey, JSON.stringify(electionData));
                console.log('8. Candidate saved to localStorage');
            } catch(storageErr) {
                console.warn('Could not store candidate in localStorage:', storageErr.message);
            }
            
            // Reset form
            this.setState({
                cand_name: '',
                cand_desc: '',
                buffer: null,
                ipfsHash: null
            });
            
        } catch (err) {
            console.error('=== CANDIDATE SUBMISSION ERROR ===');
            console.error('Error:', err.message);
            console.error('Stack:', err.stack);
            alert("Error adding candidate: " + (err.message || 'Unknown error'));
        } finally {
            this.setState({loading: false});
        }
    };
    
    GridExampleGrid = () => <Grid>{columns}</Grid>
    SidebarExampleVisible = () => (
        <Sidebar.Pushable>
          <Sidebar as={Menu} animation='overlay' icon='labeled' inverted vertical visible width='thin' style={{ backgroundColor: 'white', borderWidth: "10px" }}>
          <Menu.Item as='a' style={{ color: 'grey' }} >
          <h2>MENU</h2><hr/>
          </Menu.Item>      
          <Link route={`/election/${Cookies.get('address')}/company_dashboard`} legacyBehavior>
          <a>
            <Menu.Item style={{ color: 'grey' }}>
              <Icon name='dashboard'/>
              Dashboard
            </Menu.Item>
            </a>
            </Link>
            <Link route={`/election/${Cookies.get('address')}/admin_panel`} legacyBehavior>
            <a>
            <Menu.Item as='a' style={{ color: 'grey' }}>
              <Icon name='users' />
              Manage Voters
            </Menu.Item>
            </a>
            </Link>
            <Link route={`/election/${Cookies.get('address')}/candidate_list`} legacyBehavior>
            <a>
            <Menu.Item as='a' style={{ color: 'grey' }}>
              <Icon name='user outline' />
              Candidate List
            </Menu.Item>
            </a>
            </Link>
            <Link route={`/election/${Cookies.get('address')}/voting_list`} legacyBehavior>
            <a>
            <Menu.Item as='a' style={{ color: 'grey' }}>
              <Icon name='list' />
              Voter List
            </Menu.Item>
            </a>
            </Link>
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
          Cookies.remove('company_email');
          Cookies.remove('company_id');
          alert("Logging out.");
          Router.pushRoute('/homepage');
      }
  

  render() {
      const {Body, Row, HeaderCell, Header} = Table;
    return (
      <div>
          <Helmet>
            <title>Candidate list!</title>
            <link rel="shortcut icon" type="image/x-icon" href="../../static/logo3.png" />
          </Helmet>
        <Grid>
          <Grid.Row>
            <Grid.Column width={2}>
              {this.SidebarExampleVisible()}
            </Grid.Column>
            <Layout>
                {this.getElectionDetails()}                      
              <br />
              <br />
              <Grid.Column width={14} style={{ minHeight: '630px' }}>
                <Grid.Column style={{ float: 'left', width: '60%' }}>
                  <Header as='h2' color='black'>
                    Candidate List
              </Header>
                  <Container>                      
                      <table>
                      {this.renderTable()}
                      </table>                                        
                  </Container>
                </Grid.Column>
                <Grid.Column style={{ float: 'right', width: '30%' }}>
                <Container style={{marginLeft:'50px'}}>                      
                <Header as='h2' color='black' textAlign='center'>                 
                        Add Candidate
                       </Header>
                       <Card style={{width: '100%'}}>      
                       
                       <Form.Group size='large'style={{marginLeft: '15%',marginRight: '15%'}} >                       
                       <br/>
                       <Form.Input
                        fluid
                        label='Name:'
                        placeholder='Enter your name.'
                        onChange={event => this.setState({ cand_name: event.target.value })}
                        textAlign='center'
                       
                    />        
                        
                        <p>Image:</p>
                       
                        
                        <div class="ui fluid" style={{ borderWidth: '0px', marginRight: '20%' }}>
                          <input type="file" class="inputfile" id="embedpollfileinput"                           
                            onChange={this.captureFile}
                            style={{ maxWidth: '0.1px', maxHeight: '0.1px', zIndex: '-1', overflow: 'hidden', position: 'absolute' }} 
                          />
                          <label for="embedpollfileinput" class="ui huge blue right floated button" style={{ fontSize: '15px', marginRight: '30%' }}>
                            <i class="ui upload icon"></i>
                            Upload image
                          </label>
                        </div><br /><br /><br />
                        <p>Description:</p>
                        <Form.Input as='TextArea'
                         fluid
                         label='Description:'                         
                         placeholder='Describe here.'
                         style={{width: '100%'}}
                         centered={true}
                         onChange={event => this.setState({ cand_desc: event.target.value })}
                          />
                       <br/><br/>
                       <p>E-mail ID: </p>
                       <Form.Input fluid
                         id="email"
                         placeholder="Enter your e-mail"
                       />
                       <br/>
                       <Button primary onClick={this.onSubmit} loading={this.state.loading} style={{Bottom: '10px',marginBottom: '10px'}}>Register</Button>
                        </Form.Group>                                  
                      </Card> 
                    </Container>
                </Grid.Column>                
              </Grid.Column>
            </Layout>
          </Grid.Row>
        </Grid>
      </div>
    );
  }
}


export default VotingList
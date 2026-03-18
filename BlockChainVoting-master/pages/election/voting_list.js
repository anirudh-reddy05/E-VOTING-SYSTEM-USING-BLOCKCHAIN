import React, { Component } from 'react';
import { Grid, Header, Button, Form, Input, Icon, Menu, Modal, Sidebar, Container, Card } from 'semantic-ui-react';
import Layout from '../../components/Layout';
import Cookies from 'js-cookie';
import {Link,Router} from '../../routes';
import Election from '../../Ethereum/election';
import {Helmet} from 'react-helmet';
class VotingList extends Component { 

    state = {
        election_address: Cookies.get('address'),
        election_name: '',
        election_description: '',
        emailArr: [],
        idArr: [],
        item: [],
    }

    async componentDidMount() {        
        var http = new XMLHttpRequest();
        var url = '/voter/';        
        var params = 'election_address='+this.state.election_address;
        http.open("POST", url, true);
        let email=[];
        let id=[]
        //Send the proper header information along with the request
        http.setRequestHeader(
            "Content-type",
            "application/x-www-form-urlencoded"
        );
        http.onreadystatechange = function() {
            //Call a function when the state changes.
            if (http.readyState == 4 && http.status == 200) {
                var responseObj = JSON.parse(http.responseText);
                if(responseObj.status=="success") {
                  for (let voter of responseObj.data.voters) {
                        email.push(voter.email);
                        id.push(voter.id);    
                  } 
                }                
            }
        };
        http.send(params);
        this.state.emailArr.push(email);
        this.state.idArr.push(id);

        try {
            const add = Cookies.get('address');
            if (!add) {
                console.error('No election address found');
                alert("Election address not found. Redirecting to login...");
                Router.pushRoute('/company_login');
                return;
            }

            let election;
            try {
                election = Election(add);
            } catch(electionErr) {
                console.warn('Failed to initialize election contract:', electionErr.message);
                this.setState({
                    election_name: 'Manage Voters',
                    election_description: 'Voters List'
                });
                return;
            }

            try {
                const summary = await election.methods.getElectionDetails().call();
                this.setState({
                    election_name: summary[0],
                    election_description: summary[1]
                });
            } catch(detailsErr) {
                console.warn('Could not fetch election details:', detailsErr.message);
                this.setState({
                    election_name: 'Manage Voters',
                    election_description: 'Voters List'
                });
            }

        } catch(err) {
            console.error("Error in componentDidMount:", err.message);
            // Don't redirect - show the page anyway
            this.setState({
                election_name: 'Manage Voters',
                election_description: 'Voters List'
            });
        }

        let ea = [];
        ea = this.state.emailArr[0];
        let ia = [];
        ia = this.state.idArr[0];            
        
        let i=-1;
        const items = ia.map(ia => {
            i++;
            return {
              header: email[i],
              description: (
                <div>                
                  <br />
                  
                  <Modal size={"tiny"} trigger={
                      <Button basic id={ia} color="green">                        
                        Edit
                      </Button>
                    }closeIcon
                  >
                    <Modal.Header>Edit E-mail ID</Modal.Header>
                    <center>
                      <Modal.Content>
                        <Input id={`EmailVal${ia}`} placeholder='E-mail ID' style={{marginBottom: '5%',marginTop: '5%'}}/>
                      </Modal.Content>
                      <Modal.Actions>
                        <Button
                          positive
                          icon="checkmark"
                          labelPosition="right"
                          content="Yes"
                          padding="30"
                          style={{ marginBottom: "10px" }}
                          onClick={this.updateEmail}
                          id={ia} 
                        />
                        <Button negative>No</Button>
                      </Modal.Actions>
                    </center>
                  </Modal>
                  <Button negative basic id={ia} value={ia} onClick={this.deleteEmail}>Delete</Button>
                </div>
              )
            };
        });
        this.setState({item: items});
    }

    updateEmail = event => {
        
        const d = event.currentTarget.id;
        const st = 'EmailVal'+event.currentTarget.id;
        const a = document.getElementById(st).value;
        const b = this.state.election_name;
        const c = this.state.election_description;
        //further proceed

        var http = new XMLHttpRequest();
        var url = '/voter/'+d;  
        var params = 'email='+a+'&election_name='+b+'&election_description='+c;
        http.open("PUT", url, true);
        //Send the proper header information along with the request
        http.setRequestHeader(
            "Content-type",
            "application/x-www-form-urlencoded"
        );
        http.onreadystatechange = function() {
            //Call a function when the state changes.
            if (http.readyState == 4 && http.status == 200) {
                var responseObj = JSON.parse(http.responseText);
                if(responseObj.status=="success") {
                  alert(responseObj.message);
                }
            }
        };
        http.send(params);
    }

    deleteEmail = event => {
        //further proceed

        var http = new XMLHttpRequest();
        var url = '/voter/'+event.currentTarget.value;        
        http.open("DELETE", url, true);
        //Send the proper header information along with the request
        http.setRequestHeader(
            "Content-type",
            "application/x-www-form-urlencoded"
        );
        http.onreadystatechange = function() {
            //Call a function when the state changes.
            if (http.readyState == 4 && http.status == 200) {
                var responseObj = JSON.parse(http.responseText);
                if(responseObj.status=="success") {
                  alert(responseObj.message);
                }                
            }
        };
        http.send();
    }

    renderTable = () => {
        return (<Card.Group items={this.state.item}/>)
    } 

    GridExampleGrid = () => <Grid>{columns}</Grid>
    SidebarExampleVisible = () => (
      <Sidebar.Pushable>
        <Sidebar as={Menu} animation='overlay' icon='labeled' inverted vertical visible width='thin' style={{ backgroundColor: 'white', borderWidth: "10px" }}>
        <Menu.Item as='a' style={{ color: 'grey' }} >
        <h2>MENU</h2><hr/>
        </Menu.Item>      
        <Link route={`/election/${Cookies.get('address')}/company_dashboard`} legacyBehavior>
        <a>
          <Menu.Item style={{ color: 'grey', fontColor: 'grey' }}>
            <Icon name='dashboard'/>
            Dashboard
          </Menu.Item>
          </a>
          </Link>
          <Link route={`/election/${Cookies.get('address')}/admin_panel`} legacyBehavior>
          <a>
          <Menu.Item as='a' style={{ color: 'grey', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
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

    register = event => {
		event.preventDefault();
		const email = document.getElementById('register_voter_email').value.trim();
		
		if(!email) {
			alert("Please enter a valid email address");
			return;
		}
		
        var http = new XMLHttpRequest();
        var url = "/voter/register";
        var params = "email=" + encodeURIComponent(email) + "&election_address=" + encodeURIComponent(this.state.election_address) + "&election_name=" + encodeURIComponent(this.state.election_name) + "&election_description=" + encodeURIComponent(this.state.election_description);
        http.open("POST", url, true);
        http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        http.onreadystatechange = function() {
            if (http.readyState == 4) {
                if(http.status == 200) {
                    var responseObj = JSON.parse(http.responseText);
                    if(responseObj.status == "success") {
                        alert(responseObj.message + "\nEmail sent to: " + email);
						document.getElementById('register_voter_email').value = '';
                    } else {
                        alert("Error: " + (responseObj.message || "Unknown error"));
                    }
                } else {
                    alert("Server error: HTTP " + http.status);
                }
            }
        };
        http.onerror = function() {
            alert("Network error - Could not reach server");
        };
    	http.send(params);
	}
	
  render() {      
    return (
      <div>
          <Helmet>
            <title>Voting list</title>
            <link rel="shortcut icon" type="image/x-icon" href="../../static/logo3.png" />
          </Helmet>
        <Grid>
          <Grid.Row>
            <Grid.Column width={2}>
              {this.SidebarExampleVisible()}
            </Grid.Column>
            <Layout>                      
              <br />
              <br />
              <Grid.Column width={14} style={{ minHeight: '630px' }}>
                <Grid.Column style={{ float: 'left', width: '60%' }}>
                  <Header as='h2' color='black'>
                    Voter List
              </Header>
                  <Container>                      
                      <table>
                      {this.renderTable()}
                      </table>                                        
                  </Container>
                </Grid.Column>
                <Grid.Column style={{ float: 'right', width: '30%' }}>
                  <Container style={{}}>
                    <Header as='h2' color='black'>
                      Register Voter
                    </Header>
                    <Card style={{ width: '100%', borderTop: '4px solid #627eea' }}>
                      <div style={{ padding: '20px' }}>
                        <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
                          📧 Register voters by entering their email addresses. They will receive login credentials automatically.
                        </p>
                        <Form.Group size='large'>
                          <Form.Input
                            fluid
                            id='register_voter_email'
                            label='Voter Email Address:'
                            placeholder='Enter voter email address'
                            type='email'
                            style={{marginTop: '10px'}}
                          />
                          <Button primary style={{ marginTop: '15px', marginBottom: '15px', width: '100%' }} onClick={this.register}>
                            Register Voter
                          </Button>
                        </Form.Group>
                        <div style={{ padding: '12px', backgroundColor: '#fff3cd', borderLeft: '4px solid #ff9800', borderRadius: '4px', fontSize: '12px', color: '#333', marginBottom: '12px' }}>
                          <strong>✉️ What voters receive:</strong><br/>
                          • Their email (voting username)<br/>
                          • Password = their email address<br/>
                          • Link to sign in and vote
                        </div>
                        <div style={{ padding: '12px', backgroundColor: '#f0f7ff', borderLeft: '4px solid #627eea', borderRadius: '4px', fontSize: '12px', color: '#333' }}>
                          <strong>📋 Voter will then:</strong><br/>
                          1. Check their email<br/>
                          2. Go to Voter Sign In page<br/>
                          3. Enter email &amp; password<br/>
                          4. Cast their vote ✅
                        </div>
                      </div>
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
import React, { Component } from 'react';
import { Table, Button, Form, Header, Icon, Menu, Sidebar, Segment, Message } from 'semantic-ui-react';
import Layout from '../../components/Layout';
import Cookies from 'js-cookie';
import { Link, Router } from '../../routes';
import { Helmet } from 'react-helmet';
import Election from '../../Ethereum/election';

class AdminPanel extends Component {
  state = {
    election_address: Cookies.get('address'),
    election_name: '',
    election_description: '',
    voters: [],
    newEmail: '',
    loading: false,
    successMessage: '',
    errorMessage: '',
    sidebarVisible: true
  };

  async componentDidMount() {
    this.loadElectionDetails();
    this.loadVoters();
  }

  loadElectionDetails = async () => {
    try {
      const add = Cookies.get('address');
      if (!add) {
        this.setState({ errorMessage: 'No election address found. Please login again.' });
        Router.pushRoute('/company_login');
        return;
      }
      const election = Election(add);
      const summary = await election.methods.getElectionDetails().call();
      this.setState({
        election_name: summary[0],
        election_description: summary[1]
      });
    } catch(err) {
      console.error('Error loading election details:', err.message);
      // In development mode, this might fail if blockchain is not configured
      // So we'll just log the error and continue
    }
  }

  loadVoters = () => {
    const { election_address } = this.state;
    const http = new XMLHttpRequest();
    const url = '/voter/';
    const params = 'election_address=' + election_address;
    
    http.open('POST', url, true);
    http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    
    http.onreadystatechange = () => {
      if (http.readyState == 4 && http.status == 200) {
        const responseObj = JSON.parse(http.responseText);
        if (responseObj.status == 'success') {
          this.setState({ 
            voters: responseObj.data.voters || [],
            errorMessage: ''
          });
        }
      }
    };
    http.send(params);
  };

  registerVoter = (event) => {
    event.preventDefault();
    const { newEmail, election_address, election_name, election_description } = this.state;
    
    if (!newEmail.trim()) {
      this.setState({ errorMessage: 'Please enter a valid email address' });
      return;
    }
    
    if (!newEmail.includes('@')) {
      this.setState({ errorMessage: 'Please enter a valid email format' });
      return;
    }

    if (!election_address) {
      this.setState({ errorMessage: 'Election address not found. Please login again.' });
      return;
    }

    this.setState({ loading: true, errorMessage: '', successMessage: '' });

    const http = new XMLHttpRequest();
    const url = '/voter/register';
    const params = 'email=' + encodeURIComponent(newEmail) + 
                   '&election_address=' + encodeURIComponent(election_address) + 
                   '&election_name=' + encodeURIComponent(election_name || 'Election') + 
                   '&election_description=' + encodeURIComponent(election_description || 'Vote now');
    
    http.open('POST', url, true);
    http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    
    http.onreadystatechange = () => {
      if (http.readyState == 4) {
        this.setState({ loading: false });
        if (http.status == 200) {
          try {
            const responseObj = JSON.parse(http.responseText);
            if (responseObj.status == 'success') {
              this.setState({ 
                successMessage: `✅ Voter "${newEmail}" registered successfully!`,
                newEmail: '',
                errorMessage: ''
              });
              // Reload voters after a short delay
              setTimeout(() => this.loadVoters(), 500);
            } else {
              this.setState({ errorMessage: `Error: ${responseObj.message}` });
            }
          } catch(e) {
            this.setState({ errorMessage: `Server error: Could not parse response` });
          }
        } else if (http.status == 500) {
          try {
            const responseObj = JSON.parse(http.responseText);
            this.setState({ errorMessage: `Server error: ${responseObj.message}` });
          } catch(e) {
            this.setState({ errorMessage: 'Server error (500) - Check that all fields are valid' });
          }
        } else {
          this.setState({ errorMessage: `HTTP Error ${http.status} - Could not register voter` });
        }
      }
    };

    http.onerror = () => {
      this.setState({ 
        loading: false,
        errorMessage: 'Network error - Could not reach server' 
      });
    };

    http.send(params);
  };

  deleteVoter = (voterId, voterEmail) => {
    if (!window.confirm(`Are you sure you want to delete voter: ${voterEmail}?`)) {
      return;
    }

    this.setState({ loading: true });

    const http = new XMLHttpRequest();
    const url = `/voter/${voterId}`;
    
    http.open('DELETE', url, true);
    http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    
    http.onreadystatechange = () => {
      if (http.readyState == 4) {
        this.setState({ loading: false });
        if (http.status == 200) {
          const responseObj = JSON.parse(http.responseText);
          if (responseObj.status == 'success') {
            this.setState({ 
              successMessage: `✅ Voter deleted: ${voterEmail}`,
              errorMessage: ''
            });
            this.loadVoters();
          } else {
            this.setState({ errorMessage: `❌ Error: ${responseObj.message}` });
          }
        } else {
          this.setState({ errorMessage: 'Server error - Could not delete voter' });
        }
      }
    };
    http.send();
  };

  signOut = () => {
    Cookies.remove('address');
    Cookies.remove('company_email');
    Cookies.remove('company_id');
    alert('Logging out.');
    Router.pushRoute('/homepage');
  };

  SidebarMenu = () => (
    <Sidebar
      as={Menu}
      animation="push"
      icon="labeled"
      inverted
      vertical
      visible={this.state.sidebarVisible}
      width="wide"
      style={{ 
        backgroundColor: '#2e5090', 
        borderRight: '3px solid #1e3a5f',
        minHeight: '100vh'
      }}
    >
      <Menu.Item style={{ color: 'white', padding: '20px' }}>
        <h2 style={{ margin: '0', fontSize: '20px' }}>ADMIN MENU</h2>
        <hr style={{ borderColor: 'rgba(255,255,255,0.3)', margin: '10px 0' }} />
      </Menu.Item>
      
      <Link route={`/election/${Cookies.get('address')}/company_dashboard`} legacyBehavior>
        <a style={{ textDecoration: 'none' }}>
          <Menu.Item style={{ color: 'white', padding: '15px 20px', fontSize: '15px' }}>
            <Icon name='chart bar outline' />
            Dashboard
          </Menu.Item>
        </a>
      </Link>
      
      <Link route={`/election/${Cookies.get('address')}/admin_panel`} legacyBehavior>
        <a style={{ textDecoration: 'none' }}>
          <Menu.Item style={{ color: 'white', padding: '15px 20px', fontSize: '15px', backgroundColor: '#1e3a5f', borderLeft: '4px solid #ffc107' }}>
            <Icon name='users' />
            Manage Voters
          </Menu.Item>
        </a>
      </Link>
      
      <Link route={`/election/${Cookies.get('address')}/candidate_list`} legacyBehavior>
        <a style={{ textDecoration: 'none' }}>
          <Menu.Item style={{ color: 'white', padding: '15px 20px', fontSize: '15px' }}>
            <Icon name='user outline' />
            Candidates
          </Menu.Item>
        </a>
      </Link>
      
      <Link route={`/election/${Cookies.get('address')}/voting_list`} legacyBehavior>
        <a style={{ textDecoration: 'none' }}>
          <Menu.Item style={{ color: 'white', padding: '15px 20px', fontSize: '15px' }}>
            <Icon name='list' />
            Voting List
          </Menu.Item>
        </a>
      </Link>
      
      <hr style={{ borderColor: 'rgba(255,255,255,0.3)', margin: '10px 0' }} />
      
      <Menu.Item style={{ color: 'white', padding: '15px 20px' }}>
        <Button 
          onClick={this.signOut} 
          style={{ 
            backgroundColor: '#dc3545', 
            color: 'white', 
            width: '100%',
            padding: '10px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
        >
          <Icon name='sign out' />
          Sign Out
        </Button>
      </Menu.Item>
    </Sidebar>
  );

  render() {
    const { voters, newEmail, loading, successMessage, errorMessage, sidebarVisible } = this.state;
    const { election_name } = this.state;

    return (
      <div style={{ minHeight: '100vh' }}>
        <Helmet>
          <title>Admin Panel - Manage Voters</title>
          <link rel="shortcut icon" type="image/x-icon" href="../../static/logo3.png" />
        </Helmet>
        
        {/* Top Navigation Bar */}
        <div style={{
          backgroundColor: '#2e5090',
          padding: '15px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: 'white', margin: '0', fontSize: '18px' }}>Block Votes Administration</h2>
          <div style={{ display: 'flex', gap: '15px' }}>
            <Link route={`/election/${Cookies.get('address')}/company_dashboard`} legacyBehavior>
              <a style={{
                color: 'white',
                textDecoration: 'none',
                padding: '8px 15px',
                backgroundColor: '#1e3a5f',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                📊 Dashboard
              </a>
            </Link>
            <Link route={`/election/${Cookies.get('address')}/admin_panel`} legacyBehavior>
              <a style={{
                color: 'white',
                textDecoration: 'none',
                padding: '8px 15px',
                backgroundColor: '#1e3a5f',
                borderRadius: '4px',
                border: '2px solid #ffc107',
                cursor: 'pointer',
                fontSize: '14px'
              }}>
                👥 Manage Voters
              </a>
            </Link>
            <Link route={`/election/${Cookies.get('address')}/candidate_list`} legacyBehavior>
              <a style={{
                color: 'white',
                textDecoration: 'none',
                padding: '8px 15px',
                backgroundColor: '#1e3a5f',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                👤 Candidates
              </a>
            </Link>
            <Link route={`/election/${Cookies.get('address')}/voting_list`} legacyBehavior>
              <a style={{
                color: 'white',
                textDecoration: 'none',
                padding: '8px 15px',
                backgroundColor: '#1e3a5f',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                📋 Voting List
              </a>
            </Link>
            <Button 
              onClick={this.signOut}
              style={{
                backgroundColor: '#dc3545',
                color: 'white',
                padding: '8px 15px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
            >
              Sign Out
            </Button>
          </div>
        </div>
        
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
          <div style={{ width: sidebarVisible ? '280px' : '0px', transition: 'width 0.3s' }}>
            {this.SidebarMenu()}
          </div>
          
          <div style={{ flex: 1, overflow: 'auto' }}>
            <div style={{ padding: '20px' }}>
              {/* Toggle Button */}
              <Button 
                icon='bars' 
                onClick={() => this.setState({ sidebarVisible: !sidebarVisible })}
                style={{ marginBottom: '20px', backgroundColor: '#2e5090', color: 'white' }}
                content={sidebarVisible ? 'Hide Menu' : 'Show Menu'}
              />
              
              {/* Header */}
              <Header as='h1' style={{ marginBottom: '30px', marginTop: '20px' }}>
                <Icon name='users' />
                <Header.Content>
                  Voter Management Panel
                  <Header.Subheader>{election_name}</Header.Subheader>
                </Header.Content>
              </Header>

              {/* Messages */}
              {successMessage && (
                <Message positive icon>
                  <Icon name='check circle' />
                  <Message.Content>{successMessage}</Message.Content>
                </Message>
              )}
              {errorMessage && (
                <Message negative icon>
                  <Icon name='warning circle' />
                  <Message.Content>{errorMessage}</Message.Content>
                </Message>
              )}

              {/* Add Voter Section */}
              <Segment style={{ marginBottom: '30px' }}>
                <Header as='h3'>
                  <Icon name='user plus' />
                  Register New Voter
                </Header>
                <Form onSubmit={this.registerVoter}>
                  <Form.Group widths='equal'>
                    <Form.Input
                      label='Email Address'
                      type='email'
                      placeholder='voter@example.com'
                      value={newEmail}
                      onChange={(e) => this.setState({ newEmail: e.target.value })}
                      disabled={loading}
                      required
                    />
                    <Form.Button
                      content='Register Voter'
                      icon='plus'
                      primary
                      loading={loading}
                      disabled={loading || !newEmail.trim()}
                      style={{ marginTop: '24px' }}
                    />
                  </Form.Group>
                </Form>
                <Message info icon size='small'>
                  <Icon name='info circle' />
                  <Message.Content>
                    Voter will receive an email with login credentials (email: their email, password: their email)
                  </Message.Content>
                </Message>
              </Segment>

              {/* Voters List Section */}
              <Segment>
                <Header as='h3'>
                  <Icon name='users' />
                  Registered Voters ({voters.length})
                </Header>
                
                {voters.length === 0 ? (
                  <Message info>
                    <Message.Header>No voters registered yet</Message.Header>
                    <p>Register voters by entering their email addresses above.</p>
                  </Message>
                ) : (
                  <Table celled striped>
                    <Table.Header>
                      <Table.Row>
                        <Table.HeaderCell width={2}>#</Table.HeaderCell>
                        <Table.HeaderCell width={10}>Email Address</Table.HeaderCell>
                        <Table.HeaderCell width={4}>Actions</Table.HeaderCell>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {voters.map((voter, index) => (
                        <Table.Row key={voter.id}>
                          <Table.Cell>{index + 1}</Table.Cell>
                          <Table.Cell>
                            <Icon name='mail' /> {voter.email}
                          </Table.Cell>
                          <Table.Cell textAlign='center'>
                            <Button
                              icon='trash'
                              negative
                              size='small'
                              onClick={() => this.deleteVoter(voter.id, voter.email)}
                              disabled={loading}
                              title='Delete voter'
                            />
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                )}
              </Segment>

              {/* Info Box */}
              <Segment secondary style={{ marginTop: '30px' }}>
                <Header as='h4'>
                  <Icon name='lightbulb' />
                  Tips for Admin
                </Header>
                <ul style={{ lineHeight: '2' }}>
                  <li>✉️ <strong>Bulk Import:</strong> You can register voters one by one using the form above</li>
                  <li>🔐 <strong>Credentials:</strong> Each voter's password equals their email address</li>
                  <li>📧 <strong>Email Required:</strong> Voters receive their credentials via email</li>
                  <li>🗑️ <strong>Delete:</strong> Click the trash icon to remove a voter (they won't be able to vote)</li>
                  <li>📊 <strong>Dashboard:</strong> View voting statistics in the Dashboard tab</li>
                </ul>
              </Segment>

            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default AdminPanel;

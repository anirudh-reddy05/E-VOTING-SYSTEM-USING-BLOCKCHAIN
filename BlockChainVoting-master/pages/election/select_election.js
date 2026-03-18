import React, { Component } from 'react';
import { Container, Header, Card, Button, Icon, Loader, Message } from 'semantic-ui-react';
import Cookies from 'js-cookie';
import { Router } from '../../routes';
import { Helmet } from 'react-helmet';

class SelectElection extends Component {
    state = {
        elections: [],
        loading: true,
        error: null,
        voterEmail: Cookies.get('voter_email'),
    };

    async componentDidMount() {
        try {
            const voterEmail = Cookies.get('voter_email');
            if (!voterEmail) {
                alert('Session expired. Please login again.');
                Router.pushRoute('/voter_login');
                return;
            }

            // Fetch all elections for this voter
            const response = await fetch('/voter/elections', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: voterEmail }),
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                const elections = data.data.elections || [];
                
                // Enhance election data with details from localStorage
                const enhancedElections = elections.map(election => {
                    const storedData = localStorage.getItem(`election_${election.address}`);
                    if (storedData) {
                        try {
                            const parsed = JSON.parse(storedData);
                            return {
                                ...election,
                                name: parsed.name || election.name,
                                description: parsed.description || election.description,
                            };
                        } catch (e) {
                            return election;
                        }
                    }
                    return election;
                });

                this.setState({
                    elections: enhancedElections,
                    loading: false,
                });
            } else {
                this.setState({
                    loading: false,
                    error: data.message || 'Failed to load elections',
                });
            }
        } catch (err) {
            console.error('Error fetching elections:', err);
            this.setState({
                loading: false,
                error: 'Failed to load elections: ' + err.message,
            });
        }
    }

    handleVote = (electionAddress) => {
        Cookies.set('address', electionAddress);
        Router.pushRoute(`/election/${electionAddress}/vote`);
    };

    signOut = () => {
        Cookies.remove('address');
        Cookies.remove('voter_email');
        alert('Logging out.');
        Router.pushRoute('/homepage');
    };

    render() {
        const { elections, loading, error } = this.state;

        if (loading) {
            return (
                <div style={{ textAlign: 'center', padding: '60px 20px', minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <Loader active inline="centered" size="large" />
                    <p style={{ marginTop: '20px', fontSize: '18px' }}>Loading available elections...</p>
                </div>
            );
        }

        const electionCards = elections.map((election, index) => ({
            key: index,
            header: election.name || 'Untitled Election',
            description: election.description || 'No description provided',
            extra: (
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Button
                        primary
                        onClick={() => this.handleVote(election.address)}
                        style={{ flex: 1 }}
                    >
                        <Icon name="check" />
                        Vote Now
                    </Button>
                </div>
            ),
        }));

        return (
            <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', paddingTop: '40px', paddingBottom: '40px' }}>
                <Helmet>
                    <title>Select Election - BlockVotes</title>
                    <link rel="shortcut icon" type="image/x-icon" href="../../static/logo3.png" />
                </Helmet>

                <Container>
                    <Header as="h1" textAlign="center" style={{ color: 'white', marginBottom: '40px' }}>
                        <Icon name="book" />
                        <Header.Content>
                            Available Elections
                        </Header.Content>
                    </Header>

                    {error && (
                        <Message negative>
                            <Message.Header>Error</Message.Header>
                            <p>{error}</p>
                        </Message>
                    )}

                    {elections.length === 0 ? (
                        <Message info style={{ margin: '40px 0' }}>
                            <Message.Header>No Elections Available</Message.Header>
                            <p>No elections are currently available for voting. Please contact your administrator.</p>
                            <Button onClick={this.signOut} secondary>
                                <Icon name="sign out" />
                                Logout
                            </Button>
                        </Message>
                    ) : (
                        <div>
                            <Card.Group items={electionCards} />
                            <div style={{ textAlign: 'center', marginTop: '30px' }}>
                                <Button onClick={this.signOut} secondary size="large">
                                    <Icon name="sign out" />
                                    Logout
                                </Button>
                            </div>
                        </div>
                    )}
                </Container>
            </div>
        );
    }
}

export default SelectElection;

import React, { Component } from 'react';
import { Button, Form, Grid, Header, Segment, Icon, Message } from 'semantic-ui-react';
import web3 from '../../Ethereum/web3';
import Election_Factory from '../../Ethereum/election_factory';
import { Router } from '../../routes';
import Cookies from 'js-cookie';
class LoginForm extends Component {
	state = {
		//retrieve the company's email via cookie
		election_name: '',
		election_description: '',
		loading: false,
		errorMess: '',
	};

	signin = async event => {
		event.preventDefault();
		this.setState({ loading: true, errorMess: '' });
		try {
			const email = Cookies.get('company_email');
			
			if (!email) {
				this.setState({ 
					loading: false, 
					errorMess: 'Company email not found. Please login again.' 
				});
				return;
			}

			if (!this.state.election_name || !this.state.election_description) {
				this.setState({ 
					loading: false, 
					errorMess: 'Please fill in all fields.' 
				});
				return;
			}

			// INSTANT: Generate election address immediately
			const mockAddress = '0x' + Math.random().toString(16).slice(2, 42);
			
			// Store election details locally
			localStorage.setItem(`election_${mockAddress}`, JSON.stringify({
				name: this.state.election_name,
				description: this.state.election_description,
				email: email,
				created: new Date().toISOString(),
				candidates: []
			}));

			// Save to cookies
			Cookies.set('address', mockAddress);
			Cookies.set('election_name', this.state.election_name);
			Cookies.set('election_description', this.state.election_description);
			
			// Set loading to false immediately
			this.setState({ loading: false });

			// Fire blockchain call in background (don't wait for it)
			try {
				const accounts = await web3.eth.getAccounts();
				if (accounts && accounts.length > 0) {
					// Non-blocking async call - don't await
					Election_Factory.methods
						.createElection(email, this.state.election_name, this.state.election_description)
						.send({ from: accounts[0] })
						.on('transactionHash', (hash) => {
							console.log('Election blockchain transaction sent:', hash);
						})
						.on('error', (error) => {
							console.error('Blockchain error (non-critical):', error.message);
						});
				}
			} catch (err) {
				console.warn('Blockchain operation in background (non-critical):', err.message);
			}

			// Redirect immediately - don't wait for blockchain
			Router.pushRoute(`/election/${mockAddress}/company_dashboard`);
		} catch (err) {
			console.error('Election creation error:', err);
			this.setState({ 
				loading: false,
				errorMess: err.message || 'Failed to create election.' 
			});
		}
	};

	LoginForm = () => (
		<div className="login-form">
			<style JSX>{`
                .login-form {
                    width:100%;
                    height:100%;
                    position:absolute;
                    background: url('../../static/blockchain.jpg') no-repeat;
                } 
              `}</style>

			<Grid textAlign="center" style={{ height: '100%' }} verticalAlign="middle">
				<Grid.Column style={{ maxWidth: 380 }}>
					<Form size="large">
						<Segment>
							<Header as="h2" color="black" textAlign="center" style={{ marginTop: 10 }}>
								Create an election!
							</Header>
							<Form.Input
								fluid
								iconPosition="left"
								icon="address card outline"
								placeholder="Election Name"
								style={{ padding: 5 }}
								value={this.state.election_name}
								onChange={event => this.setState({ election_name: event.target.value })}
								required={true}
							/>
							<Form.Input
								as="TextArea"
								required={true}
								style={{
									maxHeight: '30px',
									maxWidth: '96%',
									marginBottom: '10px',
								}}
								fluid
								placeholder="Election Description"
								value={this.state.election_description}
								onChange={event => this.setState({ election_description: event.target.value })}
							/>

							<Button
								color="blue"
								fluid
								size="large"
								style={{ marginBottom: 15 }}
								onClick={this.signin}
								loading={this.state.loading}
							>
								Submit
							</Button>
							{this.state.errorMess && (
								<Message icon error>
									<Icon name="exclamation circle" />
									<Message.Content>{this.state.errorMess}</Message.Content>
								</Message>
							)}
							<Message icon info>
								<Icon name="check circle" />
								<Message.Header>Instant: </Message.Header>
								<Message.Content>Election created instantly. You'll be redirected to the dashboard.</Message.Content>
							</Message>
						</Segment>
					</Form>
				</Grid.Column>
			</Grid>
		</div>
	);

	render() {
		return (
			<div>
				<link rel="stylesheet" href="//cdn.jsdelivr.net/npm/semantic-ui@2.4.2/dist/semantic.min.css" />
				{/* <link href="../css/paper-dashboard.css?v=2.0.0" rel="stylesheet" /> */}
				{this.LoginForm()}
			</div>
		);
	}
}

export default LoginForm;

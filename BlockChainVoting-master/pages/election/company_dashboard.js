import React, { Component } from 'react';
import { Grid, Step, Icon, Menu, Sidebar, Container, Modal, Card, Header, Button, Item } from 'semantic-ui-react';
import Layout from '../../components/Layout';
import { Bar } from 'react-chartjs-2';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
} from 'chart.js';
import 'chartjs-plugin-annotation';
import Election from '../../Ethereum/election';
import Cookies from 'js-cookie';
import web3 from '../../Ethereum/web3';
import { Link, Router } from '../../routes';
import { Helmet } from 'react-helmet';

// Register Chart.js components
ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend
);

var b = 0;
let cand = [];
let graphEmail = [];
let graphVotes = [];

const options = {
	maintainAspectRatio: true,
	responsive: true,
	scales: {
		y: {
			stacked: true,
			gridLines: {
				display: true,
				color: 'rgba(255,99,132,0.2)',
			},
		},
		x: {
			gridLines: {
				display: false,
			},
		},
	},
	plugins: {
		legend: {
			position: 'top',
		},
		title: {
			display: true,
			text: 'Candidate Vote Counts',
		},
	},
};

// Initial data with safe defaults
let data = {
	labels: graphEmail.length > 0 ? graphEmail : ['No candidates yet'],
	datasets: [
		{
			label: 'Vote Counts',
			backgroundColor: 'rgba(255,99,132,0.2)',
			borderColor: 'rgba(255,99,132,1)',
			borderWidth: 2,
			hoverBackgroundColor: 'rgba(255,99,132,0.4)',
			hoverBorderColor: 'rgba(255,99,132,1)',
			data: graphVotes.length > 0 ? graphVotes : [0],
		},
	],
};

class ContainerExampleContainer extends Component {
	state = {
		election_address: Cookies.get('address'),
		election_name: '',
		election_desc: '',
		voters: 0,
		candidates: 0,
		visible: false,
		loading: false,
		b: 0,
	};
	async componentDidMount() {
		var http = new XMLHttpRequest();
		var url = '/voter/';
		var params = 'election_address=' + Cookies.get('address');
		http.open('POST', url, true);
		//Send the proper header information along with the request
		http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		http.onreadystatechange = function () {
			//Call a function when the state changes.
			if (http.readyState == 4 && http.status == 200) {
				var responseObj = JSON.parse(http.responseText);
				if (responseObj.status == 'success') {
					b = responseObj.count;
				}
			}
		};
		http.send(params);
		
		try {
			const add = Cookies.get('address');
			if (!add) {
				console.error('No election address found');
				alert('Election address not found. Redirecting to login...');
				Router.pushRoute('/company_login');
				return;
			}

			// Try to load from localStorage first (instant)
			const storedElection = localStorage.getItem(`election_${add}`);
			if (storedElection) {
				const electionData = JSON.parse(storedElection);
				this.setState({
					election_name: electionData.name,
					election_desc: electionData.description,
					candidates: electionData.candidates ? electionData.candidates.length : 0
				});

				// If localStorage includes candidates and votes, prefer that for immediate dashboard graph
				try {
					if (electionData.candidates && electionData.candidates.length > 0) {
						graphEmail = electionData.candidates.map(c => c.name || c.header || 'Candidate');
						graphVotes = electionData.candidates.map(c => parseInt(c.votes || c.count || 0, 10));
						// Trigger a re-render to update chart
						this.setState({ b: electionData.candidates.length });
					}
				} catch (lsGraphErr) {
					console.warn('Could not populate dashboard graph from localStorage:', lsGraphErr.message);
				}
			} else {
				// Fall back to blockchain if not in localStorage
				try {
					const election = Election(add);
					const summary = await election.methods.getElectionDetails().call();
					const c = await election.methods.getNumOfCandidates().call();
					this.setState({
						election_name: summary[0],
						election_desc: summary[1],
						candidates: c
					});
				} catch (blockchainErr) {
					console.warn('Blockchain loading skipped:', blockchainErr.message);
					// Use cookies as fallback
					this.setState({
						election_name: Cookies.get('election_name') || 'Election',
						election_desc: Cookies.get('election_description') || 'Dashboard'
					});
				}
			}
			
			// Load voters count with fallback
			try {
				const election = Election(add);
				const v = await election.methods.getNumOfVoters().call();
				this.setState({ voters: v });
			} catch (err) {
				console.warn('Could not load voter count:', err.message);
				this.setState({ voters: 0 });
			}

			// Load candidates in background (non-blocking)
			try {
				const election = Election(add);
				const c = await election.methods.getNumOfCandidates().call();
				graphEmail = []; // Reset global arrays
				graphVotes = [];
				
				for (let i = 0; i < c; i++) {
					try {
						const tp = await election.methods.getCandidate(i).call();
						graphEmail.push(tp[0]);
						graphVotes.push(tp[3]);
					} catch (candErr) {
						console.warn(`Could not load candidate ${i}:`, candErr.message);
					}
				}
				
				// Update graph after candidates are loaded
				this.setState({ b: c });
				this.forceUpdate(); // Force re-render with updated graph data
			} catch (err) {
				console.warn('Could not load candidates from blockchain:', err.message);
				// Candidates will show 0 if not loaded
			}

			// Fetch server-side stored votes (persistent) and prefer them if available
			try {
				const resp = await fetch('/voter/get_votes', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ election_address: add })
				});
				const json = await resp.json();
				if (json && json.status === 'success' && json.data && Array.isArray(json.data.candidates) && json.data.candidates.length > 0) {
					try {
						graphEmail = json.data.candidates.map(c => c.name || `Candidate ${c.id}`);
						graphVotes = json.data.candidates.map(c => parseInt(c.votes || 0, 10));
						this.setState({ b: json.data.candidates.length });
						console.log('Dashboard updated from server-side votes');
					} catch(e) {
						console.warn('Error applying server votes to graph:', e.message);
					}
				}
			} catch(fetchErr) {
				console.warn('Could not fetch votes from server:', fetchErr.message);
			}
		} catch (err) {
			console.error('Dashboard error:', err.message);
			// Don't redirect - show dashboard with what we could load
			this.setState({
				election_name: 'Election Dashboard',
				election_desc: 'Loading...'
			});
		}
	}

	getElectionDetails = () => {
		const { election_name, election_desc } = this.state;

		return (
			<div style={{ marginLeft: '43%', marginBottom: '2%', marginTop: '2%', float: 'left' }}>
				<Header as="h2">
					<Icon name="address card" />
					<Header.Content>
						{election_name}
						<Header.Subheader>{election_desc}</Header.Subheader>
					</Header.Content>
				</Header>
			</div>
		);
	};
	CardExampleGroupProps = () => <Card.Group></Card.Group>;
	GridExampleGrid = () => <Grid>{columns}</Grid>;
	SidebarExampleVisible = () => (
		<Sidebar.Pushable>
			<Sidebar
				as={Menu}
				animation="push"
				icon="labeled"
				inverted
				vertical
				visible
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
						<Menu.Item style={{ color: 'white', padding: '15px 20px', fontSize: '15px', backgroundColor: '#1e3a5f', borderLeft: '4px solid #ffc107' }}>
							<Icon name='chart bar outline' />
							Dashboard
						</Menu.Item>
					</a>
				</Link>
				<Link route={`/election/${Cookies.get('address')}/admin_panel`} legacyBehavior>
					<a style={{ textDecoration: 'none' }}>
						<Menu.Item style={{ color: 'white', padding: '15px 20px', fontSize: '15px' }}>
							<Icon name="users" />
							Manage Voters
						</Menu.Item>
					</a>
				</Link>
				<Link route={`/election/${Cookies.get('address')}/candidate_list`} legacyBehavior>
					<a style={{ textDecoration: 'none' }}>
						<Menu.Item style={{ color: 'white', padding: '15px 20px', fontSize: '15px' }}>
							<Icon name="user outline" />
							Candidates
						</Menu.Item>
					</a>
				</Link>
				<Link route={`/election/${Cookies.get('address')}/voting_list`} legacyBehavior>
					<a style={{ textDecoration: 'none' }}>
						<Menu.Item style={{ color: 'white', padding: '15px 20px', fontSize: '15px' }}>
							<Icon name="list" />
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
		</Sidebar.Pushable>
	);
	signOut() {
		Cookies.remove('address');
		Cookies.remove('company_email');
		Cookies.remove('company_id');
		alert('Logging out.');
		Router.pushRoute('/homepage');
	}
	endElection = async event => {
		let candidate = 0;
		try {
			this.setState({ loading: true });
			const add = Cookies.get('address');
			const election = Election(add);
			candidate = await election.methods.winnerCandidate().call();
			cand = await election.methods.getCandidate(candidate).call();
			var http = new XMLHttpRequest();
			var url = '/voter/resultMail';
			var params =
				'election_address=' +
				Cookies.get('address') +
				'&election_name=' +
				this.state.election_name +
				'&candidate_email=' +
				cand[4] +
				'&winner_candidate=' +
				cand[0];
			http.open('POST', url, true);
			//Send the proper header information along with the request
			http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
			http.onreadystatechange = function () {
				//Call a function when the state changes.
				if (http.readyState == 4 && http.status == 200) {
					var responseObj = JSON.parse(http.responseText);
					if (responseObj.status == 'success') {
						alert('Mail sent!');
					} else {
						alert(responseObj.message);
					}
				}
			};
			this.setState({ loading: true });
			http.send(params);
		} catch (err) {
			console.log(err.message);
		}
	};

	returnModal = () => <h1>I won the election</h1>;

	returnGraph = () => {
		// Create fresh data object with current values
		const chartData = {
			labels: graphEmail.length > 0 ? graphEmail : ['No candidates yet'],
			datasets: [
				{
					label: 'Vote Counts',
					backgroundColor: 'rgba(255,99,132,0.2)',
					borderColor: 'rgba(255,99,132,1)',
					borderWidth: 2,
					hoverBackgroundColor: 'rgba(255,99,132,0.4)',
					hoverBorderColor: 'rgba(255,99,132,1)',
					data: graphVotes.length > 0 ? graphVotes : [0],
				},
			],
		};
		return <Bar data={chartData} width={120} height={50} options={options} />;
	};

	render() {
		return (
			<div>
				<Helmet>
					<title>Dashboard</title>
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
								border: '2px solid #ffc107',
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

				<Grid>
					<Grid.Row>
						<Grid.Column width={2}>{this.SidebarExampleVisible()}</Grid.Column>

						<Layout>
							<Grid.Column width={16}>
								{this.getElectionDetails()}
								<Button
									negative
									style={{ float: 'right', marginTop: '2%' }}
									onClick={this.endElection}
									loading={this.state.loading}
								>
									End election
								</Button>
								<Step.Group style={{ minWidth: 1130, minHeight: 90 }}>
									<Step icon="users" title="Voters" description={this.state.b} />
									<Step icon="user outline" title="Candidates" description={this.state.candidates} />
									<Step
										icon="chart bar outline"
										title="Total Votes"
										description={this.state.voters}
									/>
								</Step.Group>
								{this.CardExampleGroupProps()}

								<Grid.Column>
									<br />
									<div className="he">
										<style jsx>{`
											.he {
												height: 50%;
												max-width: 100%;
											}
										`}</style>
										{this.returnGraph()}
									</div>
								</Grid.Column>
							</Grid.Column>
						</Layout>
					</Grid.Row>
				</Grid>
			</div>
		);
	}
}

export default ContainerExampleContainer;

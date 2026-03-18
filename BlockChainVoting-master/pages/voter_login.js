import React, { Component } from 'react';
import Cookies from 'js-cookie';
import { Router } from '../routes';
import { Helmet } from 'react-helmet';

class VoterLogin extends Component {
	state = {
		loading: false,
	};

	signin = (event) => {
		event.preventDefault();
		const email = document.getElementById('signin_email').value.trim();
		const password = document.getElementById('signin_password').value.trim();
		
		if(!email || !password) {
			alert("Please fill in all fields");
			return;
		}
		
		this.setState({ loading: true });
		
		var http = new XMLHttpRequest();
		var url = 'voter/authenticate';
		var params = 'email=' + encodeURIComponent(email) + '&password=' + encodeURIComponent(password);
		http.open('POST', url, true);
		http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		http.onreadystatechange = () => {
			if (http.readyState == 4) {
				this.setState({ loading: false });
				if(http.status == 200) {
					try {
						var responseObj = JSON.parse(http.responseText);
						console.log('Auth response:', responseObj);
						if (responseObj.status == 'success') {
							Cookies.set('voter_email', email);
							Cookies.set('address', responseObj.data.election_address);
							alert('Login successful!');
							// Redirect to elections selection page where voter can see all available elections
							Router.pushRoute('/election/select_election');
						} else {
							alert(responseObj.message || "Authentication failed - Invalid email/password");
						}
					} catch(e) {
						alert("Error parsing response: " + e.message);
					}
				} else {
					alert("Server error: HTTP " + http.status);
				}
			}
		};
		http.onerror = () => {
			this.setState({ loading: false });
			alert("Network error - Could not reach server");
		};
		http.send(params);
	};

	render() {
		const { loading } = this.state;
		return (
			<div>
				<Helmet>
					<title>Voter Login</title>
					<link rel="shortcut icon" type="image/x-icon" href="../../static/logo3.png" />
				</Helmet>
				
				<style>{`
					.login-bg {
						position: fixed;
						top: 0;
						left: 0;
						width: 100%;
						height: 100%;
						background: url('/static/blockchain.jpg') no-repeat center center;
						background-size: cover;
						z-index: -1;
					}
					
					.login-container {
						width: 100%;
						height: 100vh;
						display: flex;
						align-items: center;
						justify-content: center;
						padding: 20px;
						box-sizing: border-box;
					}
					
					.form-wrapper {
						background: white;
						padding: 40px;
						border-radius: 10px;
						box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
						width: 100%;
						max-width: 400px;
					}
					
					.form-title {
						text-align: center;
						margin-bottom: 30px;
						color: #333;
						font-size: 24px;
						font-weight: bold;
					}
					
					.form-group {
						margin-bottom: 20px;
					}
					
					.form-group label {
						display: block;
						margin-bottom: 8px;
						font-weight: bold;
						color: #333;
						font-size: 14px;
					}
					
					.form-group input {
						width: 100%;
						padding: 12px;
						border: 1px solid #ddd;
						border-radius: 5px;
						font-size: 14px;
						box-sizing: border-box;
					}
					
					.form-group input:focus {
						outline: none;
						border-color: #627eea;
						box-shadow: 0 0 5px rgba(98, 126, 234, 0.3);
					}
					
					.submit-button {
						width: 100%;
						padding: 12px;
						background: #627eea;
						color: white;
						border: none;
						border-radius: 5px;
						font-size: 16px;
						font-weight: bold;
						cursor: pointer;
						transition: all 0.3s;
					}
					
					.submit-button:hover:not(:disabled) {
						background: #516cd9;
					}
					
					.submit-button:disabled {
						opacity: 0.6;
						cursor: not-allowed;
					}
				`}</style>
				
				<div className="login-bg"></div>
				
				<div className="login-container">
					<div className="form-wrapper">
						<h3 className="form-title">Voter Sign In</h3>
						<p style={{textAlign: 'center', color: '#666', marginBottom: '20px', fontSize: '14px'}}>
							Sign in with your email and password to vote
						</p>
						<form onSubmit={this.signin}>
							<div className="form-group">
								<label>Email Address</label>
								<input 
									type="email"
									id="signin_email"
									placeholder="Enter your registered email"
									required
									disabled={loading}
									autoComplete="email"
								/>
							</div>
							<div className="form-group">
								<label>Password</label>
								<input 
									type="password"
									id="signin_password"
									placeholder="Enter your password"
									required
									disabled={loading}
									autoComplete="current-password"
								/>
							</div>
							<button type="submit" className="submit-button" disabled={loading}>
								{loading ? 'Signing In...' : 'Sign In'}
							</button>
						</form>
						<div style={{marginTop: '25px', padding: '15px', backgroundColor: '#f0f7ff', borderLeft: '4px solid #627eea', borderRadius: '5px'}}>
							<p style={{margin: '0 0 10px 0', fontWeight: 'bold', color: '#333', fontSize: '13px'}}>
								📋 How does voter registration work?
							</p>
							<ol style={{margin: '10px 0', paddingLeft: '20px', fontSize: '12px', color: '#555', lineHeight: '1.6'}}>
								<li><strong>Election Administrator</strong> goes to "Voter List" page</li>
								<li>Admin enters your email in the "Register Voter" form</li>
								<li>You receive an email with your login credentials</li>
								<li>You enter your email and password here to sign in</li>
								<li>Vote! ✅</li>
							</ol>
							<p style={{margin: '10px 0 0 0', fontSize: '11px', color: '#999'}}>
								📧 <strong>Password:</strong> Your password is your email address
							</p>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export default VoterLogin;

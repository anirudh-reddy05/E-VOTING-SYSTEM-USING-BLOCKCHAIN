import React, { Component } from "react";
import { Router } from '../routes'
import web3 from "../Ethereum/web3";
import Election_Factory from "../Ethereum/election_factory";
import Cookies from 'js-cookie';
import { Helmet } from 'react-helmet'

class CompanyLogin extends Component {
  state = { isSignUp: false, loading: false };
  
  signup = (event) => {
    event.preventDefault();
    const email = document.getElementById('signup_email').value;
    const password = document.getElementById('signup_password').value;
    const repeat_password = document.getElementById('signup_repeat_password').value;
    
    if(!email || !password || !repeat_password) {
      alert("Please fill in all fields");
      return;
    }
    
    if(password != repeat_password) {
      alert("Passwords do not match");		
      return;
    }
    
    this.setState({ loading: true });
    
    var http = new XMLHttpRequest();
    var url = 'company/register';
    var params = 'email='+encodeURIComponent(email)+'&password='+encodeURIComponent(password);
    http.open('POST', url, true);
    http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    http.onreadystatechange = () => {
        if(http.readyState == 4) {
          this.setState({ loading: false });
          if(http.status == 200) {
            try {
              var responseObj = JSON.parse(http.responseText)
              if(responseObj.status=="success") {					                    
                Cookies.set('company_email', encodeURI(responseObj.data.email));                    				                    
                alert("Registration successful! Please login.");
                document.getElementById('signup_email').value = '';
                document.getElementById('signup_password').value = '';
                document.getElementById('signup_repeat_password').value = '';
                this.setState({ isSignUp: false });
              }
              else {
                alert(responseObj.message || "Registration failed");
              }
            } catch(e) {
              alert("Error: " + e.message);
            }
          } else {
            alert("Server error: " + http.status);
          }
        }
    }
    http.send(params); 
  }
  
  signin = async (event) => {
    event.preventDefault();
    const email = document.getElementById('signin_email').value;
    const password = document.getElementById('signin_password').value;
    
    if(!email || !password) {
      alert("Please fill in all fields");
      return;
    }
    
    this.setState({ loading: true });
    
    var http = new XMLHttpRequest();
    var url = "company/authenticate";
    var params = "email=" + encodeURIComponent(email) + "&password=" + encodeURIComponent(password);
    http.open("POST", url, true);
    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    
    http.onreadystatechange = async () => {
      if (http.readyState == 4) {
        if (http.status == 200) {
          try {
            var responseObj = JSON.parse(http.responseText);
            if(responseObj.status == "success") {
              Cookies.set('company_id', encodeURI(responseObj.data.id));
              Cookies.set('company_email', encodeURI(responseObj.data.email));
              
              try {
                const accounts = await web3.eth.getAccounts();
                if (!accounts || accounts.length === 0) {
                  // For development without MetaMask, just proceed
                  console.log('No blockchain accounts found - using development mode');
                  Router.pushRoute(`/election/create_election`);
                  this.setState({ loading: false });
                  return;
                }
                
                let summary;
                try {
                  summary = await Election_Factory.methods.getDeployedElection(email).call({from: accounts[0]});
                } catch(blockchainErr) {
                  console.warn("Blockchain contract call warning (development mode):", blockchainErr.message);
                  // In development mode, just proceed
                  Router.pushRoute(`/election/create_election`);
                  this.setState({ loading: false });
                  return;
                }
                
                if(summary[2] == "Create an election.") {            
                  Router.pushRoute(`/election/create_election`);
                }
                else {           
                  Cookies.set('address',summary[0]);
                  Router.pushRoute(`/election/${summary[0]}/company_dashboard`);
                }
              } catch(error) {
                console.error("Error during login:", error);
                // In development, still allow proceeding
                Router.pushRoute(`/election/create_election`);
              }
            } else {
              alert(responseObj.message || "Authentication failed");
            }
          } catch(e) {
            alert("Error: " + e.message);
          }
        } else {
          alert("Server error: " + http.status);
        }
        this.setState({ loading: false });
      }
    };
    http.send(params); 
  }

  render() {
    const { isSignUp, loading } = this.state;
    return (
      <div>
        <Helmet>
          <title>Company Login</title>
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
          
          .form-tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 30px;
          }
          
          .form-tabs button {
            flex: 1;
            padding: 10px;
            border: 2px solid #627eea;
            background: white;
            color: #627eea;
            cursor: pointer;
            border-radius: 5px;
            font-weight: bold;
            transition: all 0.3s;
            font-size: 14px;
          }
          
          .form-tabs button.active {
            background: #627eea;
            color: white;
          }
          
          .form-tabs button:hover {
            background: #627eea;
            color: white;
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
        
        <div className="login-container" suppressHydrationWarning>
          <div className="form-wrapper">
            <div className="form-tabs">
              <button 
                className={!isSignUp ? 'active' : ''}
                onClick={() => this.setState({ isSignUp: false })}
              >
                Sign In
              </button>
              <button 
                className={isSignUp ? 'active' : ''}
                onClick={() => this.setState({ isSignUp: true })}
              >
                Sign Up
              </button>
            </div>
            
            {/* Sign In Form */}
            {!isSignUp && (
              <div>
                <h3 className="form-title">Company Sign In</h3>
                <form onSubmit={this.signin}>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input 
                      type="email"
                      id="signin_email"
                      placeholder="Enter your email"
                      required
                      disabled={loading}
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
                  />
                </div>
                <button type="submit" className="submit-button" disabled={loading}>
                  {loading ? 'Signing In...' : 'Submit'}
                </button>
              </form>
              </div>
            )}
            
            {/* Sign Up Form */}
            {isSignUp && (
              <div>
                <h3 className="form-title">Company Sign Up</h3>
                <form onSubmit={this.signup}>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input 
                      type="email"
                      id="signup_email"
                      placeholder="Enter your email"
                      required
                      disabled={loading}
                    />
                  </div>
                <div className="form-group">
                  <label>Password</label>
                  <input 
                    type="password"
                    id="signup_password"
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label>Repeat Password</label>
                  <input 
                    type="password"
                    id="signup_repeat_password"
                    placeholder="Repeat your password"
                    required
                    disabled={loading}
                  />
                </div>
                <button type="submit" className="submit-button" disabled={loading}>
                  {loading ? 'Signing Up...' : 'Submit'}
                </button>
              </form>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default CompanyLogin;

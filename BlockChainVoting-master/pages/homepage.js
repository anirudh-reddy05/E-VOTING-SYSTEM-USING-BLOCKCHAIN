import React from 'react';
import { Link } from '../routes';
import { Helmet } from 'react-helmet';

export default function HomePage() {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <Helmet>
        <title>BlockVotes - E-voting System</title>
        <link rel="shortcut icon" type="image/x-icon" href="../../static/logo3.png" />
      </Helmet>
      
      <div style={{
        backgroundColor: '#627eea',
        color: 'white',
        padding: '60px 20px',
        textAlign: 'center',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <h1 style={{ fontSize: '48px', margin: '0 0 20px 0', fontFamily: 'Freestyle Script' }}>
          BlockVotes
        </h1>
        <h2 style={{ fontSize: '32px', fontWeight: 'normal', margin: '0 0 40px 0' }}>
          A blockchain-based E-voting system, built with love.
        </h2>
        <p style={{ fontSize: '18px', margin: '0 0 60px 0' }}>
          Make your vote count!
        </p>
        
        <div style={{ display: 'flex', gap: '40px', justifyContent: 'center' }}>
          <div style={{ textAlign: 'left' }}>
            <h4>Register/Sign in for the company</h4>
            <Link route="/company_login" legacyBehavior>
              <a style={{
                backgroundColor: 'white',
                color: '#627eea',
                padding: '12px 24px',
                textDecoration: 'none',
                borderRadius: '5px',
                display: 'inline-block',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}>
                ← Company
              </a>
            </Link>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <h4>Sign in for Voters!</h4>
            <Link route="/voter_login" legacyBehavior>
              <a style={{
                backgroundColor: 'white',
                color: '#627eea',
                padding: '12px 24px',
                textDecoration: 'none',
                borderRadius: '5px',
                display: 'inline-block',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}>
                Voters →
              </a>
            </Link>
          </div>
        </div>
      </div>

      <div style={{ padding: '60px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '40px',
          marginBottom: '60px'
        }}>
          <div>
            <h3 style={{ fontSize: '24px' }}>Private</h3>
            <p style={{ fontSize: '16px' }}>
              Doesn't give any information regarding personal data.
            </p>
            
            <h3 style={{ fontSize: '24px' }}>Secure</h3>
            <p style={{ fontSize: '16px' }}>
              Not even a single chance of shutting down of the system.
            </p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <img src="../static/ether2.png" alt="Ethereum" width="216" height="256" style={{ marginTop: '50px' }} />
          </div>

          <div>
            <h3 style={{ fontSize: '24px' }}>Decentralized</h3>
            <p style={{ fontSize: '16px' }}>
              Decentralized technology gives you the power to store your assets in a network.
            </p>
            
            <h3 style={{ fontSize: '24px' }}>Immutable</h3>
            <p style={{ fontSize: '16px' }}>
              Keeps its ledgers in a never-ending state of forwarding momentum.
            </p>
          </div>
        </div>
      </div>

      <div style={{
        backgroundColor: '#627eea',
        color: 'white',
        padding: '60px 20px',
        textAlign: 'center'
      }}>
        <h3 style={{ fontSize: '24px' }}>A fascinating quote</h3>
        <p style={{ fontSize: '18px', fontStyle: 'italic' }}>
          "We have elected to put our money and faith in a mathematical framework that is free of politics and human error."
        </p>
        <p style={{ fontSize: '18px', fontWeight: 'bold' }}>Tyler Winklevoss</p>
      </div>
    </div>
  );
}

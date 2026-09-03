import React, { useState } from 'react';
import { auth } from '../firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  async function handleSignup(e) {
    e.preventDefault();
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(cred.user);
      setUser(cred.user);
      alert('Verification email sent. Please check your inbox.');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      setUser(cred.user);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleLogout() {
    await signOut(auth);
    setUser(null);
  }

  return (
    <div style={{maxWidth: 420}}>
      <h3>Sign up / Log in</h3>
      <form onSubmit={handleLogin}>
        <div>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </div>
        <div>
          <label>Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </div>
        <div style={{marginTop:8}}>
          <button onClick={handleLogin} type="button">Log in</button>
          <button onClick={handleSignup} type="button" style={{marginLeft:8}}>Sign up</button>
          <button onClick={handleLogout} type="button" style={{marginLeft:8}}>Log out</button>
        </div>
      </form>
      {error && <div style={{color:'red'}}>{error}</div>}
      {user && <div>Signed in as {user.email} (uid: {user.uid})</div>}
    </div>
  );
}

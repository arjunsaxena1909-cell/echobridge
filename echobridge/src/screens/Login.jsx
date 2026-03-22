import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import './Auth.css'

export default function Login() {
  const navigate = useNavigate()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError(error.message)
    else navigate('/')
  }

  return (
    <div className="screen auth auth-screen">
      <div className="auth-top">
        <div className="auth-logo">🌉</div>
        <h1>EchoBridge</h1>
        <p style={{ color:'var(--text-light)', marginTop:4 }}>Connecting generations through stories</p>
      </div>

      <div className="auth-card card">
        <h2 style={{ marginBottom:6 }}>Welcome back</h2>
        <p style={{ color:'var(--text-light)', fontSize:14, marginBottom:24 }}>Sign in to continue sharing stories</p>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Email address</label>
            <input className="input" type="email" placeholder="your@email.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input className="input" type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Login'}
          </button>
        </form>

        <div className="divider">or</div>

        <p style={{ textAlign:'center', fontSize:14 }}>
          Don't have an account? <Link to="/signup" className="auth-link">Sign Up</Link>
        </p>
      </div>
    </div>
  )
}

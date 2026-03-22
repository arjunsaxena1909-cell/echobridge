import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import './Auth.css'

export default function SignUp() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ fullName:'', email:'', password:'', ageGroup:'', community:'' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSignUp(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    const { data, error: signUpErr } = await supabase.auth.signUp({
      email: form.email, password: form.password,
    })
    if (signUpErr) { setError(signUpErr.message); setLoading(false); return }

    const { error: profileErr } = await supabase.from('profiles').insert({
      id: data.user.id,
      full_name: form.fullName,
      age_group: form.ageGroup,
      community: form.community,
    })
    setLoading(false)
    if (profileErr) { setError(profileErr.message); return }
    navigate('/')
  }

  return (
    <div className="screen auth auth-screen">
      <div className="auth-top" style={{ paddingTop:40 }}>
        <div className="auth-logo">🌉</div>
        <h1>EchoBridge</h1>
        <p style={{ color:'var(--text-light)', marginTop:4 }}>Join your community</p>
      </div>

      <div className="auth-card card">
        {/* Step indicator */}
        <div className="step-indicator">
          <div className={`step-dot ${step >= 1 ? 'active':''}`} />
          <div className="step-line" />
          <div className={`step-dot ${step >= 2 ? 'active':''}`} />
        </div>

        {step === 1 && (
          <>
            <h2 style={{ marginBottom:6 }}>Tell us about you</h2>
            <p style={{ color:'var(--text-light)', fontSize:14, marginBottom:20 }}>Step 1 of 2</p>

            <div className="input-group">
              <label>Full Name</label>
              <input className="input" placeholder="Your name"
                value={form.fullName} onChange={e => set('fullName', e.target.value)} />
            </div>
            <div className="input-group">
              <label>Email address</label>
              <input className="input" type="email" placeholder="your@email.com"
                value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input className="input" type="password" placeholder="Min. 6 characters"
                value={form.password} onChange={e => set('password', e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={() => {
              if (!form.fullName || !form.email || form.password.length < 6) { setError('Please fill all fields (password min 6 chars)'); return }
              setError(''); setStep(2)
            }}>Next →</button>
          </>
        )}

        {step === 2 && (
          <form onSubmit={handleSignUp}>
            <h2 style={{ marginBottom:6 }}>Your community</h2>
            <p style={{ color:'var(--text-light)', fontSize:14, marginBottom:20 }}>Step 2 of 2</p>

            <div className="input-group">
              <label>I am a…</label>
              <div className="age-group-picker">
                {[{val:'elder', label:'Elder', sub:'Age 65–80', emoji:'👴'},{val:'teen', label:'Youth', sub:'Age 13–25', emoji:'🧑'}].map(opt => (
                  <button type="button" key={opt.val}
                    className={`age-option ${form.ageGroup === opt.val ? 'selected' : ''}`}
                    onClick={() => set('ageGroup', opt.val)}>
                    <span style={{fontSize:28}}>{opt.emoji}</span>
                    <span className="age-label">{opt.label}</span>
                    <span className="age-sub">{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="input-group">
              <label>Community / Area</label>
              <input className="input" placeholder="e.g. Andheri, Mumbai"
                value={form.community} onChange={e => set('community', e.target.value)} />
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button className="btn btn-primary" type="submit" disabled={loading || !form.ageGroup}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
            <button type="button" className="btn btn-ghost" style={{marginTop:8}} onClick={() => setStep(1)}>← Back</button>
          </form>
        )}

        {step === 1 && (
          <>
            {error && <p className="auth-error">{error}</p>}
            <div className="divider" style={{ marginTop:12 }}>already a member?</div>
            <p style={{ textAlign:'center', fontSize:14 }}>
              <Link to="/login" className="auth-link">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

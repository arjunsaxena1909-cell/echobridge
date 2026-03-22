import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { useAuth } from '../context/AuthContext'
import StoryCard from '../components/StoryCard'
import './Profile.css'

export default function Profile() {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [stories,  setStories]  = useState([])
  const [editing,  setEditing]  = useState(false)
  const [form,     setForm]     = useState({ full_name:'', bio:'', community:'' })
  const [privacy,  setPrivacy]  = useState('community')
  const [saving,   setSaving]   = useState(false)
  const [toast,    setToast]    = useState(null)
  const [tab,      setTab]      = useState('stories')
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile,    setAvatarFile]    = useState(null)

  useEffect(() => {
    if (profile) {
      setForm({ full_name: profile.full_name||'', bio: profile.bio||'', community: profile.community||'' })
      setPrivacy(profile.default_privacy || 'community')
    }
    fetchMyStories()
  }, [profile])

  async function fetchMyStories() {
    if (!user) return
    const { data } = await supabase
      .from('stories').select('*, profiles(*), prompts(question), reactions(*), comments(id)')
      .eq('user_id', user.id).order('created_at', { ascending: false })
    setStories(data || [])
  }

  function handleAvatarPick(e) {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function saveProfile() {
    setSaving(true)

    let avatar_url = profile?.avatar_url || null

    if (avatarFile) {
      const ext  = avatarFile.name.split('.').pop()
      const path = `avatars/${user.id}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('stories').upload(path, avatarFile, { upsert: true, contentType: avatarFile.type })
      if (upErr) { showToast(upErr.message, 'error'); setSaving(false); return }
      const { data: { publicUrl } } = supabase.storage.from('stories').getPublicUrl(path)
      avatar_url = publicUrl
    }

    const { error } = await supabase.from('profiles')
      .update({ full_name: form.full_name, bio: form.bio, community: form.community, avatar_url })
      .eq('id', user.id)

    setSaving(false)
    if (error) { showToast(error.message, 'error'); return }
    await refreshProfile()
    setEditing(false)
    setAvatarFile(null)
    showToast('Profile updated ✓', 'success')
  }

  async function deleteStory(storyId) {
    if (!confirm('Delete this story?')) return
    await supabase.from('stories').delete().eq('id', storyId)
    fetchMyStories()
    showToast('Story deleted', 'default')
  }

  function showToast(msg, type = 'default') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const initials = profile?.full_name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || '?'
  const avatarSrc = avatarPreview || profile?.avatar_url

  return (
    <div className="screen">
      {/* Profile header */}
      <div className="profile-header">
        <div className="profile-avatar-wrap" onClick={() => editing && fileInputRef.current?.click()}>
          {avatarSrc
            ? <img src={avatarSrc} alt="avatar" className="avatar profile-avatar img" />
            : <div className="avatar profile-avatar">{initials}</div>
          }
          {editing && <div className="avatar-edit-badge">📷</div>}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*"
          style={{ display:'none' }} onChange={handleAvatarPick} />

        <h2>{profile?.full_name || 'Your Name'}</h2>
        <span className={`pill pill-${profile?.age_group}`}>
          {profile?.age_group === 'elder' ? 'Elder · 65–80' : 'Youth · 13–25'}
        </span>
        {profile?.community && (
          <p style={{ color:'var(--text-light)', fontSize:13, marginTop:4 }}>📍 {profile.community}</p>
        )}
        {profile?.bio && (
          <p style={{ fontSize:14, marginTop:8, textAlign:'center' }}>{profile.bio}</p>
        )}

        <div className="profile-stats">
          <div className="stat"><strong>{stories.length}</strong><small>Stories</small></div>
          <div className="stat"><strong>{stories.reduce((a,s)=>(a+(s.reactions?.length||0)),0)}</strong><small>Reactions</small></div>
          <div className="stat"><strong>{stories.reduce((a,s)=>(a+(s.comments?.length||0)),0)}</strong><small>Responses</small></div>
        </div>

        <button className="btn btn-secondary btn-sm" style={{ marginTop:12 }}
          onClick={() => setEditing(!editing)}>
          {editing ? 'Cancel' : '✏️  Edit Profile'}
        </button>
      </div>

      {/* Edit form */}
      {editing && (
        <div style={{ padding:'0 16px 16px' }}>
          <div className="card">
            <p style={{ fontSize:13, color:'var(--text-light)', marginBottom:12 }}>
              Tap your profile picture above to change it
            </p>
            <div className="input-group">
              <label>Full Name</label>
              <input className="input" value={form.full_name}
                onChange={e => setForm(f=>({...f,full_name:e.target.value}))} />
            </div>
            <div className="input-group">
              <label>Bio</label>
              <textarea className="input" rows={3} placeholder="Tell your community about yourself…"
                value={form.bio} onChange={e => setForm(f=>({...f,bio:e.target.value}))} />
            </div>
            <div className="input-group">
              <label>Community / Area</label>
              <input className="input" value={form.community}
                onChange={e => setForm(f=>({...f,community:e.target.value}))} />
            </div>
            <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="profile-tabs">
        {['stories','settings'].map(t => (
          <button key={t} className={`profile-tab ${tab===t?'active':''}`} onClick={() => setTab(t)}>
            {t === 'stories' ? '🎙 My Stories' : '⚙️ Settings'}
          </button>
        ))}
      </div>

      {tab === 'stories' && (
        <div style={{ padding:'0 16px' }}>
          {stories.length === 0 ? (
            <div className="empty-state">
              <div className="emoji">🎙️</div>
              <h3>No stories yet</h3>
              <p>Record your first story to get started!</p>
              <button className="btn btn-primary btn-sm"
                style={{ marginTop:16, display:'inline-block' }}
                onClick={() => navigate('/record')}>Record Now</button>
            </div>
          ) : (
            stories.map(s => (
              <div key={s.id} style={{ position:'relative' }}>
                <StoryCard story={s} onReactionUpdate={fetchMyStories} />
                <button
                  onClick={() => deleteStory(s.id)}
                  style={{
                    position:'absolute', top:12, right:12,
                    background:'var(--error)', color:'white',
                    border:'none', borderRadius:8, padding:'4px 10px',
                    fontSize:12, cursor:'pointer', fontFamily:'Poppins,sans-serif'
                  }}>
                  🗑 Delete
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'settings' && (
        <div style={{ padding:'0 16px 24px' }}>
          <div className="card" style={{ marginBottom:12 }}>
            <h3 style={{ marginBottom:14 }}>Account</h3>
            <p style={{ fontSize:13, color:'var(--text-light)', marginBottom:6 }}>Signed in as</p>
            <p style={{ fontWeight:600, marginBottom:16 }}>{user?.email}</p>
            <button className="btn btn-danger" onClick={handleSignOut}>Sign Out</button>
          </div>
          <div className="card">
            <h3 style={{ marginBottom:10 }}>About EchoBridge</h3>
            <p style={{ fontSize:13, color:'var(--text-light)', lineHeight:1.6 }}>
              EchoBridge is a two-way digital storytelling platform connecting elderly individuals (65–80)
              and teenagers (13–25) through short audio and video stories within local communities.
            </p>
          </div>
        </div>
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  )
}

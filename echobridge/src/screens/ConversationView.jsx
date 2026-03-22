import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { useAuth } from '../context/AuthContext'
import './ConversationView.css'

const REACTIONS = [
  { type:'heart', emoji:'❤️' },
  { type:'spark', emoji:'✨' },
  { type:'hug',   emoji:'🤗' },
]

export default function ConversationView() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const bottomRef = useRef(null)

  const [story,    setStory]    = useState(null)
  const [comments, setComments] = useState([])
  const [text,     setText]     = useState('')
  const [posting,  setPosting]  = useState(false)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => { fetchAll() }, [id])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [comments])

  async function fetchAll() {
    const [{ data: s }, { data: c }] = await Promise.all([
      supabase.from('stories').select('*, profiles(*), prompts(question), reactions(*)').eq('id', id).single(),
      supabase.from('comments').select('*, profiles(full_name, age_group)').eq('story_id', id).order('created_at'),
    ])
    setStory(s); setComments(c || [])
    setLoading(false)
  }

  async function postComment() {
    if (!text.trim()) return
    setPosting(true)
    await supabase.from('comments').insert({ user_id: user.id, story_id: id, content: text.trim() })
    setText('')
    setPosting(false)
    fetchAll()
  }

  async function react(type) {
    const existing = story?.reactions?.find(r => r.user_id === user.id)
    if (existing?.reaction_type === type) {
      await supabase.from('reactions').delete().eq('id', existing.id)
    } else if (existing) {
      await supabase.from('reactions').update({ reaction_type: type }).eq('id', existing.id)
    } else {
      await supabase.from('reactions').insert({ user_id: user.id, story_id: id, reaction_type: type })
    }
    fetchAll()
  }

  if (loading) return <div className="screen"><div className="spinner" /></div>
  if (!story)  return <div className="screen"><div className="empty-state"><p>Story not found</p></div></div>

  const p = story.profiles
  const initials = p?.full_name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || '??'
  const userReaction = story.reactions?.find(r => r.user_id === user.id)

  return (
    <div className="screen">
      {/* Back header */}
      <div className="conv-header">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <h3 style={{ flex:1, textAlign:'center' }}>Story</h3>
        <div style={{ width:60 }} />
      </div>

      {/* Story section */}
      <div style={{ padding:'0 16px 16px' }}>
        <div className="card" style={{ marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
            <div className="avatar" style={{ width:44, height:44, fontSize:16 }}>{initials}</div>
            <div>
              <p style={{ fontWeight:600 }}>{p?.full_name || 'Anonymous'}</p>
              <span className={`pill pill-${p?.age_group}`}>{p?.age_group === 'elder' ? 'Elder 65–80' : 'Youth 13–25'}</span>
            </div>
          </div>

          <h2 style={{ marginBottom:12 }}>{story.title}</h2>

          {story.prompts?.question && (
            <div className="prompt-tag" style={{ marginBottom:12 }}>💡 {story.prompts.question}</div>
          )}

          {story.media_url && (
            <div style={{ marginBottom:12 }}>
              {story.media_type === 'video'
                ? <video src={story.media_url} controls style={{ width:'100%', borderRadius:10, background:'#000' }} />
                : <audio  src={story.media_url} controls style={{ width:'100%' }} />
              }
            </div>
          )}

          {/* Reactions */}
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {REACTIONS.map(r => {
              const count = story.reactions?.filter(x => x.reaction_type === r.type).length || 0
              const active = userReaction?.reaction_type === r.type
              return (
                <button key={r.type}
                  className={`reaction-btn ${active ? 'active' : ''}`}
                  onClick={() => react(r.type)}>
                  {r.emoji} <span>{count || ''}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Comments */}
        <h3 style={{ marginBottom:12 }}>Responses ({comments.length})</h3>

        {comments.length === 0 && (
          <div className="empty-state" style={{ padding:'24px 0' }}>
            <p>No responses yet. Be the first to respond!</p>
          </div>
        )}

        {comments.map(c => {
          const ini = c.profiles?.full_name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || '??'
          const isMe = c.user_id === user.id
          return (
            <div key={c.id} className={`comment-bubble ${isMe ? 'me' : ''}`}>
              {!isMe && (
                <div className="avatar" style={{ width:32, height:32, fontSize:12, flexShrink:0 }}>{ini}</div>
              )}
              <div className="comment-content">
                {!isMe && <p className="comment-name">{c.profiles?.full_name}</p>}
                <div className={`comment-text ${isMe ? 'me' : ''}`}>{c.content}</div>
                <small style={{ color:'var(--text-light)', fontSize:11 }}>
                  {new Date(c.created_at).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
                </small>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Comment input */}
      <div className="comment-input-bar">
        <div className="avatar" style={{ width:34, height:34, fontSize:13, flexShrink:0 }}>
          {profile?.full_name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || '?'}
        </div>
        <input className="input" style={{ flex:1, padding:'10px 14px', fontSize:14 }}
          placeholder="Write a response…"
          value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && postComment()} />
        <button className="btn btn-primary btn-sm" onClick={postComment} disabled={posting || !text.trim()}>
          {posting ? '…' : 'Send'}
        </button>
      </div>
    </div>
  )
}

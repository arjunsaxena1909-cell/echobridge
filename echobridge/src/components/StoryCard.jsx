import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { useAuth } from '../context/AuthContext'
import './StoryCard.css'

const REACTIONS = [
  { type: 'heart', emoji: '❤️',  label: 'Love' },
  { type: 'spark', emoji: '✨',  label: 'Inspiring' },
  { type: 'hug',   emoji: '🤗',  label: 'Warm hug' },
]

export default function StoryCard({ story, onReactionUpdate }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [reacting, setReacting] = useState(false)

  const profile = story.profiles
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
    : '??'
  const ageGroup = profile?.age_group
  const reactions = story.reactions || []
  const userReaction = reactions.find(r => r.user_id === user?.id)

  async function handleReact(type) {
    if (reacting) return
    setReacting(true)
    try {
      if (userReaction?.reaction_type === type) {
        await supabase.from('reactions').delete().eq('id', userReaction.id)
      } else if (userReaction) {
        await supabase.from('reactions').update({ reaction_type: type }).eq('id', userReaction.id)
      } else {
        await supabase.from('reactions').insert({ user_id: user.id, story_id: story.id, reaction_type: type })
      }
      onReactionUpdate?.()
    } finally {
      setReacting(false)
    }
  }

  function countReaction(type) {
    return reactions.filter(r => r.reaction_type === type).length
  }

  const elapsed = (() => {
    const d = new Date(story.created_at)
    const diff = (Date.now() - d) / 1000
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
    return d.toLocaleDateString('en-IN', { day:'numeric', month:'short' })
  })()

  return (
    <div className="story-card card" onClick={() => navigate(`/story/${story.id}`)}>
      {/* Header */}
      <div className="story-header">
        {profile?.avatar_url
          ? <img src={profile.avatar_url} alt="" style={{ width:42, height:42, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />
          : <div className="avatar" style={{ width:42, height:42, fontSize:16 }}>{initials}</div>
        }
        <div className="story-meta">
          <div className="story-username">{profile?.full_name || 'Anonymous'}</div>
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            <span className={`pill pill-${ageGroup}`}>{ageGroup === 'elder' ? '65–80' : '13–25'}</span>
            <small>{elapsed}</small>
          </div>
        </div>
      </div>

      {/* Title */}
      <h3 style={{ margin:'10px 0 8px', fontSize:16 }}>{story.title}</h3>

      {/* Media */}
      {story.media_url && (
        <div className="story-media">
          {story.media_type === 'video' ? (
            <video src={story.media_url} controls style={{ width:'100%', borderRadius:10, maxHeight:200, background:'#000' }} />
          ) : (
            <audio src={story.media_url} controls style={{ width:'100%' }} />
          )}
        </div>
      )}

      {/* Prompt tag */}
      {story.prompts?.question && (
        <div className="prompt-tag">💡 {story.prompts.question}</div>
      )}

      {/* Reactions */}
      <div className="story-reactions" onClick={e => e.stopPropagation()}>
        {REACTIONS.map(r => (
          <button
            key={r.type}
            className={`reaction-btn ${userReaction?.reaction_type === r.type ? 'active' : ''}`}
            onClick={() => handleReact(r.type)}
            title={r.label}
          >
            {r.emoji} <span>{countReaction(r.type) || ''}</span>
          </button>
        ))}
        <button className="reaction-btn comment-btn" onClick={() => navigate(`/story/${story.id}`)}>
          💬 <span>{story.comments?.length || 0}</span>
        </button>
      </div>
    </div>
  )
}

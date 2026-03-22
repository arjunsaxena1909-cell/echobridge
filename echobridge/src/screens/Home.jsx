import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { useAuth } from '../context/AuthContext'
import StoryCard from '../components/StoryCard'
import './Home.css'

const PROMPTS_PREVIEW = [
  { emoji:'🌅', text:'A moment that changed you' },
  { emoji:'📚', text:'A childhood memory' },
  { emoji:'💪', text:'A moment you felt proud' },
  { emoji:'🎓', text:'Advice for the next generation' },
]

export default function Home() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchStories = useCallback(async () => {
    const { data } = await supabase
      .from('stories')
      .select(`
        *,
        profiles (id, full_name, age_group, avatar_url),
        prompts (question),
        reactions (id, user_id, reaction_type),
        comments (id)
      `)
      .neq('privacy', 'private')
      .order('created_at', { ascending: false })
      .limit(30)
    setStories(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchStories() }, [fetchStories])

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <div className="screen">
      {/* Header */}
      <div className="home-header">
        <div>
          <p style={{ fontSize:13, color:'var(--text-light)' }}>{greeting},</p>
          <h2>{profile?.full_name?.split(' ')[0] || 'Friend'} 👋</h2>
        </div>
        <div className="avatar" style={{ width:44, height:44, fontSize:17, cursor:'pointer' }}
          onClick={() => navigate('/profile')}>
          {profile?.full_name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || '?'}
        </div>
      </div>

      {/* Today's prompt banner */}
      <div className="home-prompt-banner" onClick={() => navigate('/prompts')}>
        <div>
          <p style={{ fontSize:11, fontWeight:600, opacity:0.8, marginBottom:2 }}>TODAY'S STORY PROMPT</p>
          <p style={{ fontSize:15, fontWeight:600 }}>What is one life lesson you wish more people understood?</p>
        </div>
        <div style={{ fontSize:32 }}>→</div>
      </div>

      {/* Quick prompts scroll */}
      <div className="home-prompts-scroll">
        <div className="section-header" style={{ padding:'0 20px' }}>
          <h3>Explore Prompts</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/prompts')}>See all</button>
        </div>
        <div className="prompts-row">
          {PROMPTS_PREVIEW.map((p, i) => (
            <div key={i} className="prompt-chip" onClick={() => navigate('/record', { state: { prompt: p.text } })}>
              <span style={{ fontSize:22 }}>{p.emoji}</span>
              <span>{p.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Story feed */}
      <div style={{ padding:'0 16px' }}>
        <div className="section-header">
          <h3>Community Stories</h3>
          <span style={{ fontSize:12, color:'var(--text-light)' }}>{stories.length} stories</span>
        </div>

        {loading && <div className="spinner" />}

        {!loading && stories.length === 0 && (
          <div className="empty-state">
            <div className="emoji">🌉</div>
            <h3>No stories yet</h3>
            <p>Be the first to share a story with your community!</p>
            <button className="btn btn-primary btn-sm" style={{ marginTop:16, display:'inline-block' }}
              onClick={() => navigate('/record')}>Record a Story</button>
          </div>
        )}

        {stories.map(story => (
          <StoryCard key={story.id} story={story} onReactionUpdate={fetchStories} />
        ))}
      </div>
    </div>
  )
}

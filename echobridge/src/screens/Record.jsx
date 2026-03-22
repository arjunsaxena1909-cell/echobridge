import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { useAuth } from '../context/AuthContext'
import './Record.css'

export default function Record() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const promptFromNav = location.state?.prompt || ''
  const promptIdFromNav = location.state?.promptId || null

  const [mode,        setMode]        = useState('audio') // 'audio' | 'video'
  const [recording,   setRecording]   = useState(false)
  const [elapsed,     setElapsed]     = useState(0)
  const [blob,        setBlob]        = useState(null)
  const [title,       setTitle]       = useState('')
  const [privacy,     setPrivacy]     = useState('community')
  const [uploading,   setUploading]   = useState(false)
  const [toast,       setToast]       = useState(null)
  const [stream,      setStream]      = useState(null)

  const mediaRef    = useRef(null)
  const chunksRef   = useRef([])
  const timerRef    = useRef(null)
  const previewRef  = useRef(null)
  const fileInputRef = useRef(null)

  const MAX_SECS = 60

  function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    const isVideo = file.type.startsWith('video/')
    const isAudio = file.type.startsWith('audio/')
    if (!isVideo && !isAudio) { showToast('Please select an audio or video file', 'error'); return }
    setMode(isVideo ? 'video' : 'audio')
    setBlob(file)
    showToast('File ready to post ✓', 'success')
  }

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current)
      stream?.getTracks().forEach(t => t.stop())
    }
  }, [stream])

  function showToast(msg, type='default') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2800)
  }

  async function startRecording() {
    try {
      const constraints = mode === 'video'
        ? { video: true, audio: true }
        : { audio: true }
      const s = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(s)

      if (mode === 'video' && previewRef.current) {
        previewRef.current.srcObject = s
        previewRef.current.play()
      }

      const mr = new MediaRecorder(s)
      mediaRef.current = mr
      chunksRef.current = []
      mr.ondataavailable = e => chunksRef.current.push(e.data)
      mr.onstop = () => {
        const mimeType = mode === 'video' ? 'video/webm' : 'audio/webm'
        const b = new Blob(chunksRef.current, { type: mimeType })
        setBlob(b)
        s.getTracks().forEach(t => t.stop())
      }
      mr.start()
      setRecording(true)
      setElapsed(0)

      timerRef.current = setInterval(() => {
        setElapsed(e => {
          if (e + 1 >= MAX_SECS) { stopRecording(); return MAX_SECS }
          return e + 1
        })
      }, 1000)
    } catch (err) {
      showToast('Microphone/camera access denied', 'error')
    }
  }

  function stopRecording() {
    clearInterval(timerRef.current)
    mediaRef.current?.stop()
    setRecording(false)
  }

  function retake() {
    setBlob(null)
    setElapsed(0)
    if (previewRef.current) previewRef.current.srcObject = null
  }

  async function handlePost() {
    if (!title.trim()) { showToast('Please add a title', 'error'); return }
    if (!blob)         { showToast('Please record something first', 'error'); return }
    setUploading(true)

    const ext  = blob.name ? blob.name.split('.').pop() : (mode === 'video' ? 'webm' : 'webm')
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('stories')
      .upload(path, blob, { contentType: blob.type })

    if (upErr) { showToast(upErr.message, 'error'); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('stories').getPublicUrl(path)

    const { error: dbErr } = await supabase.from('stories').insert({
      user_id:    user.id,
      title:      title.trim(),
      media_url:  publicUrl,
      media_type: mode,
      prompt_id:  promptIdFromNav,
      privacy,
    })
    setUploading(false)
    if (dbErr) { showToast(dbErr.message, 'error'); return }
    showToast('Story posted! 🎉', 'success')
    setTimeout(() => navigate('/'), 1400)
  }

  const fmtTime = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
  const pct = (elapsed / MAX_SECS) * 100

  return (
    <div className="screen">
      <div style={{ padding:'24px 20px 0' }}>
        <h2>Share Your Story</h2>
        {promptFromNav && (
          <div className="prompt-tag" style={{ marginTop:10 }}>
            💡 {promptFromNav}
          </div>
        )}
      </div>

      {/* Mode toggle */}
      <div className="mode-toggle">
        {['audio','video'].map(m => (
          <button key={m} className={`mode-btn ${mode===m?'active':''}`}
            onClick={() => { if (!recording) { setMode(m); setBlob(null) } }}>
            {m === 'audio' ? '🎙️ Audio' : '📹 Video'}
          </button>
        ))}
      </div>

      {/* File upload option */}
      <div style={{ padding:'10px 16px 0', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ flex:1, height:1, background:'var(--beige-dark)' }} />
        <span style={{ fontSize:12, color:'var(--text-light)', whiteSpace:'nowrap' }}>or upload a file</span>
        <div style={{ flex:1, height:1, background:'var(--beige-dark)' }} />
      </div>
      <div style={{ padding:'10px 16px 0' }}>
        <input ref={fileInputRef} type="file"
          accept="audio/*,video/*" style={{ display:'none' }}
          onChange={handleFileUpload} />
        <button className="btn btn-secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={recording}>
          📁 Upload Audio or Video File
        </button>
      </div>

      {/* Recording interface */}
      <div className="record-area">
        {mode === 'video' && (
          <video ref={previewRef} className="video-preview" muted playsInline
            style={{ display: blob ? 'none' : 'block' }} />
        )}

        {blob && (
          <div className="playback-area">
            {mode === 'video'
              ? <video src={URL.createObjectURL(blob)} controls className="video-preview" />
              : <audio  src={URL.createObjectURL(blob)} controls style={{ width:'100%' }} />
            }
          </div>
        )}

        {!blob && (
          <>
            {/* Timer ring */}
            <div className="timer-ring-wrap">
              <svg className="timer-ring" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="var(--blue-light)" strokeWidth="8" />
                <circle cx="60" cy="60" r="54" fill="none"
                  stroke={elapsed > 50 ? '#E07070' : 'var(--blue-dark)'}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 54}`}
                  strokeDashoffset={`${2 * Math.PI * 54 * (1 - pct/100)}`}
                  style={{ transform:'rotate(-90deg)', transformOrigin:'center', transition:'stroke-dashoffset .5s' }}
                />
              </svg>
              <div className="timer-text">{fmtTime(elapsed)}</div>
            </div>
            <p style={{ color:'var(--text-light)', fontSize:13, marginBottom:24 }}>
              {recording ? `Recording… ${MAX_SECS - elapsed}s left` : 'Tap the button to start recording'}
            </p>

            {/* Main record button */}
            <button
              className={`big-record-btn ${recording ? 'stop' : ''}`}
              onClick={recording ? stopRecording : startRecording}>
              {recording ? '⏹ Stop' : '⏺ Record'}
            </button>
          </>
        )}

        {blob && (
          <div style={{ display:'flex', gap:12, marginTop:16, width:'100%' }}>
            <button className="btn btn-secondary" style={{ flex:1 }} onClick={retake}>↩ Retake</button>
          </div>
        )}
      </div>

      {/* Story details */}
      {blob && (
        <div style={{ padding:'0 16px 20px' }}>
          <div className="input-group">
            <label>Story Title</label>
            <input className="input" placeholder="Give your story a title…"
              value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="input-group">
            <label>Visibility</label>
            <div className="privacy-row">
              {[
                { val:'public',    label:'🌐 Public'    },
                { val:'community', label:'🏘 Community' },
                { val:'private',   label:'🔒 Private'   },
              ].map(opt => (
                <button key={opt.val} type="button"
                  className={`privacy-btn ${privacy===opt.val?'active':''}`}
                  onClick={() => setPrivacy(opt.val)}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-primary" onClick={handlePost} disabled={uploading}>
            {uploading ? 'Uploading…' : '🚀 Post Story'}
          </button>
        </div>
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  )
}

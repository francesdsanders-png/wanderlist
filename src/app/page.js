'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const PLACE_TYPES = ['Experience', 'Shop']
const TAG_GROUPS = {
  "Who's Coming":    ['👨‍👩‍👧 Family', '🧒 Kids', '🔞 Adults Only', '💑 Date Night', '🙋 Solo', '👥 Group'],
  'Type of Trip':    ['🌅 Day Trip', '🏨 Weekend Getaway', '✈️ Holiday', '🎉 Special Occasion'],
  'Logistics':       ['🚗 Drive', '✈️ Fly', '💰 Paid', '🆓 Free', '🏠 Indoor', '🌿 Outdoor'],
  'Experience Type': ['🍽️ Restaurant', '🍸 Bar', '🌲 Nature', '🛍️ Shopping', '🎭 Entertainment', '🏃 Activity', '🏨 Hotel'],
  'Reservation':     ['📋 Reservation Needed', '🚶 Walk-in Welcome'],
}
const EMPTY_FORM = {
  name: '', address: '', cost: '', phone: '', website: '', reference: '',
  place_type: '', tags: [], trip_status: 'Pending', partner_status: 'Undecided',
  rating: null, want_to_return: null, notes: ''
}

const T = {
  bg: '#EEF2F7', white: '#FFFFFF', blue: '#1A73E8', blueSoft: '#E8F0FE',
  green: '#1E8E3E', greenSoft: '#E6F4EA', red: '#D93025', redSoft: '#FCE8E6',
  text: '#202124', muted: '#5F6368', border: '#DADCE0',
  shadow: '0 1px 3px rgba(60,64,67,0.15)',
}

function Badge({ label }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: 20,
      background: T.white, color: T.muted, fontSize: 13, border: '1px solid ' + T.border,
      margin: '3px 4px 3px 0', whiteSpace: 'nowrap', fontFamily: 'Roboto, sans-serif'
    }}>{label}</span>
  )
}

function StatusChip({ status }) {
  const map = {
    'Undecided': { bg: '#F1F3F4', color: T.muted },
    "We're In":  { bg: T.greenSoft, color: T.green },
    'Pass':      { bg: T.redSoft, color: T.red },
    'Pending':   { bg: '#FFF8E1', color: '#F9AB00' },
    'Scheduled': { bg: T.blueSoft, color: T.blue },
    'Completed': { bg: T.greenSoft, color: T.green },
  }
  const s = map[status] || map['Undecided']
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
      background: s.bg, color: s.color, whiteSpace: 'nowrap'
    }}>{status}</span>
  )
}

function MapsLink({ address }) {
  if (!address) return null
  const href = 'https://maps.apple.com/?q=' + encodeURIComponent(address)
  return (
    <a href={href} target="_blank" rel="noreferrer" style={{
      color: T.blue, fontSize: 14, marginBottom: 6, display: 'flex',
      alignItems: 'center', gap: 4, textDecoration: 'none', fontWeight: 500
    }} onClick={e => e.stopPropagation()}>
      <span>📍</span>{address}
    </a>
  )
}

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(null)
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
      {[1,2,3,4,5].map(n => (
        <button key={n} onClick={() => onChange(value === n ? null : n)}
          onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(null)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', fontSize: 32, padding: 0,
            color: T.blue, opacity: (hovered ?? value ?? 0) >= n ? 1 : 0.2,
            transform: (hovered ?? value ?? 0) >= n ? 'scale(1.15)' : 'scale(1)',
            transition: 'all 0.1s'
          }}>★</button>
      ))}
    </div>
  )
}

function SegRow({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
      {options.map(([label, val, color]) => {
        const active = value === val
        const colors = {
          green: { bg: T.greenSoft, color: T.green },
          red:   { bg: T.redSoft, color: T.red },
          blue:  { bg: T.blueSoft, color: T.blue },
          gold:  { bg: '#FFF8E1', color: '#F9AB00' },
          def:   { bg: T.blueSoft, color: T.blue },
        }
        const c = colors[color] || colors.def
        return (
          <button key={String(val)} onClick={() => onChange(val)} style={{
            flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer',
            fontWeight: 600, fontSize: 13, fontFamily: 'Roboto, sans-serif',
            border: active ? 'none' : '1px solid ' + T.border,
            background: active ? c.bg : T.white, color: active ? c.color : T.muted,
          }}>{label}</button>
        )
      })}
    </div>
  )
}

function HouseholdScreen({ onJoin }) {
  const [mode, setMode] = useState('choose')
  const [householdName, setHouseholdName] = useState('')
  const [yourName, setYourName] = useState('')
  const [code, setCode] = useState('')
  const [joinName, setJoinName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    if (!householdName.trim() || !yourName.trim()) return
    setLoading(true); setError('')
    const res = await fetch('/api/households', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', name: householdName })
    })
    const data = await res.json()
    if (data.error) { setError(data.error); setLoading(false); return }
    onJoin(data.household, yourName)
  }

  async function handleJoin() {
    if (!code.trim() || !joinName.trim()) return
    setLoading(true); setError('')
    const res = await fetch('/api/households', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join', code })
    })
    const data = await res.json()
    if (data.error) { setError('Code not found. Check and try again.'); setLoading(false); return }
    onJoin(data.household, joinName)
  }

  const inp = {
    width: '100%', padding: '14px 16px', borderRadius: 12, fontSize: 16,
    border: '1px solid ' + T.border, fontFamily: 'Roboto, sans-serif',
    background: T.white, color: T.text, outline: 'none', boxSizing: 'border-box'
  }
  const primaryBtn = {
    width: '100%', padding: '14px', borderRadius: 24, fontSize: 16, fontWeight: 700,
    background: T.blue, color: T.white, border: 'none', cursor: 'pointer',
    fontFamily: 'Roboto, sans-serif', marginTop: 8, opacity: loading ? 0.7 : 1
  }
  const ghostBtn = {
    width: '100%', padding: '14px', borderRadius: 24, fontSize: 15, fontWeight: 600,
    background: T.white, color: T.blue, border: '1px solid ' + T.border,
    cursor: 'pointer', fontFamily: 'Roboto, sans-serif', marginTop: 8
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🗺️</div>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: T.blue, textTransform: 'uppercase', marginBottom: 6 }}>YOUR WISHLIST</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: T.text, fontFamily: "'Google Sans', Roboto, sans-serif", letterSpacing: -1 }}>Map Out</div>
          <div style={{ fontSize: 15, color: T.muted, marginTop: 8 }}>Save and discover places together</div>
        </div>
        {mode === 'choose' && (
          <div style={{ background: T.white, borderRadius: 20, padding: 28, boxShadow: T.shadow }}>
            <button onClick={() => setMode('create')} style={primaryBtn}>✨ Create a new list</button>
            <button onClick={() => setMode('join')} style={ghostBtn}>🔑 Join with a code</button>
          </div>
        )}
        {mode === 'create' && (
          <div style={{ background: T.white, borderRadius: 20, padding: 28, boxShadow: T.shadow }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 20 }}>Create your list</div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: T.muted, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>List Name</label>
              <input placeholder="e.g. Frances & Jay" value={householdName} onChange={e => setHouseholdName(e.target.value)} style={inp} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: T.muted, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Your Name</label>
              <input placeholder="e.g. Frances" value={yourName} onChange={e => setYourName(e.target.value)} style={inp} />
            </div>
            {error && <div style={{ color: T.red, fontSize: 14, marginBottom: 8 }}>{error}</div>}
            <button onClick={handleCreate} disabled={loading} style={primaryBtn}>{loading ? 'Creating...' : 'Create List'}</button>
            <button onClick={() => setMode('choose')} style={ghostBtn}>Back</button>
          </div>
        )}
        {mode === 'join' && (
          <div style={{ background: T.white, borderRadius: 20, padding: 28, boxShadow: T.shadow }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 20 }}>Join a list</div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: T.muted, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Your Name</label>
              <input placeholder="e.g. Jay" value={joinName} onChange={e => setJoinName(e.target.value)} style={inp} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: T.muted, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>List Code</label>
              <input placeholder="e.g. FRANCE-X7K2" value={code} onChange={e => setCode(e.target.value.toUpperCase())} style={{ ...inp, letterSpacing: 2, fontWeight: 700 }} />
            </div>
            {error && <div style={{ color: T.red, fontSize: 14, marginBottom: 8 }}>{error}</div>}
            <button onClick={handleJoin} disabled={loading} style={primaryBtn}>{loading ? 'Joining...' : 'Join List'}</button>
            <button onClick={() => setMode('choose')} style={ghostBtn}>Back</button>
          </div>
        )}
      </div>
    </div>
  )
}
export default function App() {
  const [household, setHousehold] = useState(null)
  const [userName, setUserName]   = useState('')
  const [places, setPlaces]       = useState([])
  const [view, setView]           = useState('list')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterTrip, setFilterTrip]     = useState('All')
  const [form, setForm]           = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [prevView, setPrevView]   = useState('list')
  const [loading, setLoading]     = useState(false)
  const [toast, setToast]         = useState(null)
  const [reviewIndex, setReviewIndex] = useState(0)
  const [showCode, setShowCode]   = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('mapout-household')
    const savedName = localStorage.getItem('mapout-username')
    if (saved) { setHousehold(JSON.parse(saved)); setUserName(savedName || '') }
  }, [])

  useEffect(() => {
    if (!household) return
    loadPlaces()
    const channel = supabase
      .channel('places-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'places', filter: `household_id=eq.${household.id}` },
        () => loadPlaces())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [household])

  async function loadPlaces() {
    const { data } = await supabase
      .from('places')
      .select('*')
      .eq('household_id', household.id)
      .order('created_at', { ascending: false })
    if (data) setPlaces(data)
  }

  function handleJoin(h, name) {
    setHousehold(h)
    setUserName(name)
    localStorage.setItem('mapout-household', JSON.stringify(h))
    localStorage.setItem('mapout-username', name)
  }

  function handleLeave() {
    localStorage.removeItem('mapout-household')
    localStorage.removeItem('mapout-username')
    setHousehold(null); setUserName(''); setPlaces([])
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2500) }

  async function savePlace() {
    if (!form.name.trim()) return
    setLoading(true)
    const payload = { ...form, household_id: household.id, added_by: userName }
    delete payload.id; delete payload.created_at; delete payload.updated_at
    if (editingId) {
      await supabase.from('places').update(payload).eq('id', editingId)
      showToast('Updated!')
    } else {
      await supabase.from('places').insert(payload)
      showToast('Place added!')
    }
    setForm(EMPTY_FORM); setEditingId(null); setLoading(false)
    setView(prevView || 'list')
  }

  async function deletePlace(id) {
    await supabase.from('places').delete().eq('id', id)
    setView('list'); showToast('Removed')
  }

  function startEdit(place, from) {
    setForm({ ...EMPTY_FORM, ...place })
    setEditingId(place.id); setPrevView(from || 'list'); setView('add')
  }

  async function updatePlace(id, updates) {
    await supabase.from('places').update(updates).eq('id', id)
    setSelectedPlace(prev => prev ? { ...prev, ...updates } : prev)
    if (updates.partner_status === "We're In") {
      const place = places.find(p => p.id === id)
      if (place) {
        fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            placeName: place.name,
            address: place.address,
            householdName: household.name,
            approvedBy: userName
          })
        })
      }
    }
  }

  const approved    = places.filter(p => p.partner_status === "We're In" && p.trip_status !== 'Completed')
  const completed   = places.filter(p => p.trip_status === 'Completed')
  const reviewQueue = places.filter(p => p.partner_status === 'Undecided')
  const filteredAll = places.filter(p => filterStatus === 'All' || p.partner_status === filterStatus)
  const filteredYes = approved.filter(p => filterTrip === 'All' || p.trip_status === filterTrip)

  const activeTab = {
    list: 'list', detail: 'list',
    yeslist: 'yeslist', yesdetail: 'yeslist',
    completed: 'completed', compdetail: 'completed',
    review: 'review', add: prevView
  }[view] || 'list'

  if (!household) return <HouseholdScreen onJoin={handleJoin} />

  const card = { background: T.white, borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: T.shadow }
  const inputStyle = {
    width: '100%', background: T.white, border: '1px solid ' + T.border,
    borderRadius: 10, padding: '11px 14px', color: T.text, fontSize: 15,
    fontFamily: 'Roboto, sans-serif', outline: 'none', boxSizing: 'border-box'
  }
  const labelStyle = { fontSize: 12, fontWeight: 700, letterSpacing: 1, color: T.muted, textTransform: 'uppercase', marginBottom: 6, display: 'block' }
  const btnPrimary = { background: T.blue, color: T.white, border: 'none', borderRadius: 24, padding: '11px 24px', fontFamily: 'Roboto, sans-serif', fontWeight: 600, fontSize: 15, cursor: 'pointer' }
  const btnGhost   = { background: 'transparent', color: T.blue, border: '1px solid ' + T.border, borderRadius: 24, padding: '9px 20px', fontFamily: 'Roboto, sans-serif', fontWeight: 600, fontSize: 14, cursor: 'pointer' }
  const btnDanger  = { background: T.redSoft, color: T.red, border: 'none', borderRadius: 10, padding: '11px 20px', fontFamily: 'Roboto, sans-serif', fontWeight: 600, fontSize: 14, cursor: 'pointer', width: '100%', marginBottom: 32 }

  function FilterChips({ options, value, onChange }) {
    return (
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 16px', scrollbarWidth: 'none' }}>
        {options.map(opt => (
          <button key={opt} onClick={() => onChange(opt)} style={{
            flexShrink: 0, padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500,
            border: '1px solid ' + (value === opt ? T.blue : T.border), cursor: 'pointer',
            background: value === opt ? T.blueSoft : T.white,
            color: value === opt ? T.blue : T.muted, fontFamily: 'Roboto, sans-serif'
          }}>{opt}</button>
        ))}
      </div>
    )
  }

  function BackBar({ onBack, onEdit }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: T.white, borderBottom: '1px solid ' + T.border }}>
        <button onClick={onBack} style={{ ...btnGhost, padding: '7px 14px', fontSize: 13 }}>← Back</button>
        {onEdit && <button onClick={onEdit} style={{ ...btnGhost, padding: '7px 14px', fontSize: 13, marginLeft: 'auto' }}>Edit</button>}
      </div>
    )
  }

  function PlaceInfo({ cur }) {
    return (
      <>
        <h2 style={{ margin: '0 0 10px', fontSize: 24, fontWeight: 700, color: T.text, fontFamily: "'Google Sans', Roboto, sans-serif" }}>{cur.name}</h2>
        <MapsLink address={cur.address} />
        {cur.cost && <div style={{ color: T.muted, fontSize: 15, marginBottom: 6 }}>💰 {cur.cost}</div>}
        {cur.phone && <div style={{ color: T.muted, fontSize: 15, marginBottom: 6 }}>📞 {cur.phone}</div>}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          {cur.website && <a href={cur.website} target="_blank" rel="noreferrer" style={{ color: T.blue, fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>🌐 Website</a>}
          {cur.reference && <a href={cur.reference} target="_blank" rel="noreferrer" style={{ color: T.blue, fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>🎬 Watch reference</a>}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: 12 }}>
          {cur.place_type && <Badge label={cur.place_type} />}
          {cur.tags?.map(t => <Badge key={t} label={t} />)}
        </div>
        {cur.notes && <div style={{ ...card, color: T.muted, fontSize: 15, lineHeight: 1.6, marginBottom: 16 }}>{cur.notes}</div>}
        {cur.added_by && <div style={{ color: T.muted, fontSize: 13, marginBottom: 16 }}>Added by {cur.added_by}</div>}
      </>
    )
  }

  function PlaceCard({ place, onYes, onPass, onEdit, onDelete, onClick }) {
    const borderColor = place.partner_status === "We're In" ? T.green : place.partner_status === 'Pass' ? T.red : T.blue
    return (
      <div style={{ ...card, borderLeft: '4px solid ' + borderColor, cursor: 'pointer' }} onClick={onClick}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.text, fontFamily: "'Google Sans', Roboto, sans-serif", flex: 1, marginRight: 8 }}>{place.name}</div>
          <StatusChip status={place.partner_status} />
        </div>
        <MapsLink address={place.address} />
        {place.cost && <div style={{ color: T.muted, fontSize: 14, marginBottom: 6 }}>💰 {place.cost}</div>}
        {place.website && <a href={place.website} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ color: T.blue, fontSize: 14, display: 'inline-flex', gap: 4, textDecoration: 'none', fontWeight: 500, marginBottom: 6, marginRight: 12 }}>🌐 Website</a>}
        {place.reference && <a href={place.reference} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ color: T.blue, fontSize: 14, display: 'inline-flex', gap: 4, textDecoration: 'none', fontWeight: 500, marginBottom: 6 }}>🎬 Watch reference</a>}
        {place.notes && <div style={{ color: T.muted, fontSize: 14, marginBottom: 8, fontStyle: 'italic' }}>{place.notes}</div>}
        <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: 10 }}>
          {place.place_type && <Badge label={place.place_type} />}
          {place.tags?.slice(0, 4).map(t => <Badge key={t} label={t} />)}
        </div>
        {place.rating && <div style={{ color: T.blue, fontSize: 16, marginBottom: 6 }}>{'★'.repeat(place.rating)}{'☆'.repeat(5 - place.rating)}</div>}
        {(place.want_to_return === true || place.want_to_return === false) && (
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: place.want_to_return ? T.green : T.red }}>
              {place.want_to_return ? '↩ Return' : '✕ One-time'}
            </span>
          </div>
        )}
        {(onYes || onPass || onEdit || onDelete) && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }} onClick={e => e.stopPropagation()}>
            {onYes && <button onClick={onYes} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid ' + T.border, background: T.white, color: T.text, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Roboto, sans-serif' }}>✓ Yes</button>}
            {onPass && <button onClick={onPass} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid ' + T.border, background: T.white, color: T.text, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Roboto, sans-serif' }}>✗ Pass</button>}
            {onEdit && <button onClick={onEdit} style={{ width: 44, height: 44, borderRadius: 10, border: '1px solid ' + T.border, background: T.white, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✏️</button>}
            {onDelete && <button onClick={onDelete} style={{ width: 44, height: 44, borderRadius: 10, border: '1px solid ' + T.border, background: T.white, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🗑️</button>}
          </div>
        )}
      </div>
    )
  }  function Header() {
    return (
      <div style={{ background: T.white, padding: '20px 16px 0', boxShadow: '0 1px 3px rgba(60,64,67,0.1)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: T.blue, textTransform: 'uppercase', marginBottom: 2 }}>YOUR WISHLIST</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: T.text, fontFamily: "'Google Sans', Roboto, sans-serif", letterSpacing: -0.5 }}>Map Out</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => setShowCode(!showCode)} style={{ ...btnGhost, padding: '7px 12px', fontSize: 12 }}>🔑 Code</button>
            <button onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setPrevView(view); setView('add') }}
              style={{ ...btnPrimary, padding: '9px 16px', fontSize: 14, borderRadius: 20 }}>+ Add</button>
          </div>
        </div>
        {showCode && (
          <div style={{ background: T.blueSoft, borderRadius: 12, padding: '12px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.blue, letterSpacing: 1, textTransform: 'uppercase' }}>Share this code</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.blue, letterSpacing: 3, fontFamily: 'Roboto, sans-serif' }}>{household.code}</div>
              <div style={{ fontSize: 12, color: T.muted }}>{household.name} · {userName}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button onClick={() => { navigator.clipboard.writeText(household.code); showToast('Code copied!') }}
                style={{ ...btnPrimary, padding: '7px 12px', fontSize: 12, borderRadius: 16 }}>Copy</button>
              <button onClick={handleLeave} style={{ ...btnGhost, padding: '6px 12px', fontSize: 11, borderRadius: 16, color: T.red, borderColor: T.red }}>Leave</button>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            { label: 'TOTAL', value: places.length, color: T.text },
            { label: 'YES LIST', value: approved.length, color: T.green },
            { label: 'TO DECIDE', value: reviewQueue.length, color: T.blue },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: T.white, border: '1px solid ' + T.border, borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "'Google Sans', Roboto, sans-serif" }}>{s.value}</div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5, color: T.muted, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[['list','All Places'],['yeslist','Yes List'],['completed','Completed'],['review', reviewQueue.length > 0 ? `Review (${reviewQueue.length})` : 'Review']].map(([tab, label]) => (
            <button key={tab} onClick={() => setView(tab)} style={{
              flexShrink: 0, padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, fontFamily: 'Roboto, sans-serif',
              color: activeTab === tab ? T.blue : T.muted,
              borderBottom: activeTab === tab ? '2px solid ' + T.blue : '2px solid transparent',
            }}>{label}</button>
          ))}
        </div>
      </div>
    )
  }

  function ListView() {
    return (
      <>
        <FilterChips options={['All', 'Undecided', "We're In", 'Pass']} value={filterStatus} onChange={setFilterStatus} />
        <div style={{ padding: '0 16px' }}>
          {filteredAll.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: T.muted }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📍</div>
              <div style={{ fontSize: 16 }}>No places yet. Tap + Add to get started.</div>
            </div>
          )}
          {filteredAll.map(place => (
            <PlaceCard key={place.id} place={place}
              onClick={() => { setSelectedPlace(place); setView('detail') }}
              onYes={place.partner_status !== "We're In" ? e => { e.stopPropagation(); updatePlace(place.id, { partner_status: "We're In" }) } : null}
              onPass={place.partner_status !== 'Pass' ? e => { e.stopPropagation(); updatePlace(place.id, { partner_status: 'Pass' }) } : null}
              onEdit={e => { e.stopPropagation(); startEdit(place, 'list') }}
              onDelete={e => { e.stopPropagation(); deletePlace(place.id) }}
            />
          ))}
        </div>
      </>
    )
  }

  function DetailView() {
    if (!selectedPlace) return null
    const cur = places.find(x => x.id === selectedPlace.id) || selectedPlace
    return (
      <>
        <BackBar onBack={() => setView('list')} onEdit={() => startEdit(cur, 'list')} />
        <div style={{ padding: 16 }}>
          <PlaceInfo cur={cur} />
          <label style={labelStyle}>Partner Decision</label>
          <SegRow options={[["We're In","We're In",'green'],['Undecided','Undecided','def'],['Pass','Pass','red']]}
            value={cur.partner_status} onChange={v => updatePlace(cur.id, { partner_status: v })} />
          <button onClick={() => deletePlace(cur.id)} style={btnDanger}>Remove Place</button>
        </div>
      </>
    )
  }

  function YesListView() {
    return (
      <>
        <FilterChips options={['All', 'Pending', 'Scheduled']} value={filterTrip} onChange={setFilterTrip} />
        <div style={{ padding: '0 16px' }}>
          {filteredYes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: T.muted }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 16 }}>No approved places yet.</div>
              <div style={{ fontSize: 14, marginTop: 8 }}>Head to Review to approve some spots.</div>
            </div>
          )}
          {filteredYes.map(place => (
            <PlaceCard key={place.id} place={place} onClick={() => { setSelectedPlace(place); setView('yesdetail') }} />
          ))}
        </div>
      </>
    )
  }

  function YesDetailView() {
    if (!selectedPlace) return null
    const cur = places.find(x => x.id === selectedPlace.id) || selectedPlace
    return (
      <>
        <BackBar onBack={() => setView('yeslist')} onEdit={() => startEdit(cur, 'yeslist')} />
        <div style={{ padding: 16 }}>
          <PlaceInfo cur={cur} />
          <label style={labelStyle}>Trip Status</label>
          <SegRow options={[['Pending','Pending','gold'],['Scheduled','Scheduled','blue'],['Completed','Completed','green']]}
            value={cur.trip_status}
            onChange={v => { updatePlace(cur.id, { trip_status: v }); if (v === 'Completed') setView('compdetail') }} />
          <button onClick={() => deletePlace(cur.id)} style={btnDanger}>Remove Place</button>
        </div>
      </>
    )
  }

  function CompletedView() {
    return (
      <div style={{ padding: '16px 16px 0' }}>
        {completed.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: T.muted }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏁</div>
            <div style={{ fontSize: 16 }}>No completed places yet.</div>
          </div>
        )}
        {completed.map(place => (
          <PlaceCard key={place.id} place={place} onClick={() => { setSelectedPlace(place); setView('compdetail') }} />
        ))}
      </div>
    )
  }

  function CompDetailView() {
    if (!selectedPlace) return null
    const cur = places.find(x => x.id === selectedPlace.id) || selectedPlace
    return (
      <>
        <BackBar onBack={() => setView('completed')} onEdit={() => startEdit(cur, 'completed')} />
        <div style={{ padding: 16 }}>
          <PlaceInfo cur={cur} />
          <label style={labelStyle}>Your Rating</label>
          <StarRating value={cur.rating} onChange={val => updatePlace(cur.id, { rating: val })} />
          <label style={labelStyle}>Would You Return?</label>
          <SegRow options={[['Yes, Return', true, 'green'],['One-time', false, 'red'],['TBD', null, 'def']]}
            value={cur.want_to_return} onChange={v => updatePlace(cur.id, { want_to_return: v })} />
          <button onClick={() => deletePlace(cur.id)} style={btnDanger}>Remove Place</button>
        </div>
      </>
    )
  }

  function ReviewView() {
    if (reviewQueue.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: T.text }}>All caught up!</div>
          <div style={{ fontSize: 15, color: T.muted }}>No undecided places left.</div>
        </div>
      )
    }
    const idx = Math.min(reviewIndex, reviewQueue.length - 1)
    const p = reviewQueue[idx]
    function decide(status) {
      updatePlace(p.id, { partner_status: status, approved_by: status === "We're In" ? userName : null })
      if (status === "We're In") { setSelectedPlace({ ...p, partner_status: "We're In" }); setView('yesdetail') }
      else if (idx >= reviewQueue.length - 1) setReviewIndex(0)
    }
    return (
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ textAlign: 'center', color: T.muted, fontSize: 14, marginBottom: 12 }}>
          {reviewQueue.length} place{reviewQueue.length !== 1 ? 's' : ''} to review
        </div>
        <div style={{ ...card, borderLeft: '4px solid ' + T.blue }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: T.text, marginBottom: 8, fontFamily: "'Google Sans', Roboto, sans-serif" }}>{p.name}</div>
          <MapsLink address={p.address} />
          {p.cost && <div style={{ color: T.muted, fontSize: 14, marginBottom: 8 }}>💰 {p.cost}</div>}
          <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: 10 }}>
            {p.place_type && <Badge label={p.place_type} />}
            {p.tags?.map(t => <Badge key={t} label={t} />)}
          </div>
          {p.notes && <div style={{ color: T.muted, fontSize: 14, marginBottom: 10, fontStyle: 'italic' }}>{p.notes}</div>}
          <div style={{ display: 'flex', gap: 12 }}>
            {p.website && <a href={p.website} target="_blank" rel="noreferrer" style={{ color: T.blue, fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>🌐 Website</a>}
            {p.reference && <a href={p.reference} target="_blank" rel="noreferrer" style={{ color: T.blue, fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>🎬 Watch reference</a>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => decide('Pass')} style={{ flex: 1, padding: '16px 0', borderRadius: 12, border: '1px solid ' + T.border, fontSize: 16, fontWeight: 700, cursor: 'pointer', background: T.white, color: T.red, fontFamily: 'Roboto, sans-serif' }}>✗ Pass</button>
          <button onClick={() => decide("We're In")} style={{ flex: 1, padding: '16px 0', borderRadius: 12, border: '1px solid ' + T.border, fontSize: 16, fontWeight: 700, cursor: 'pointer', background: T.white, color: T.green, fontFamily: 'Roboto, sans-serif' }}>✓ We're In</button>
        </div>
      </div>
    )
  }

  function FormView() {
    const [lf, setLf] = useState(form)
    const toggle = (arr, val) => arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]
    return (
      <div style={{ background: T.bg, minHeight: '100vh' }}>
        <div style={{ background: T.white, padding: '16px', boxShadow: '0 1px 3px rgba(60,64,67,0.1)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => { setView(prevView || 'list'); setForm(EMPTY_FORM); setEditingId(null) }} style={{ ...btnGhost, padding: '7px 14px', fontSize: 13 }}>← Back</button>
          <span style={{ fontWeight: 700, fontSize: 18, color: T.text }}>{editingId ? 'Edit Place' : 'Add Place'}</span>
        </div>
        <div style={{ padding: '16px 16px 0' }}>
          {[['Name','name','text'],['Address','address','text'],['Est. Cost','cost','text'],['Phone','phone','tel'],['Website URL','website','url'],['Reel / Reference URL','reference','url']].map(([label, key, type]) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <label style={labelStyle}>{label}</label>
              <input type={type} value={lf[key]} onChange={e => setLf(f => ({ ...f, [key]: e.target.value }))} style={inputStyle} />
            </div>
          ))}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Place Type</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {PLACE_TYPES.map(pt => (
                <button key={pt} onClick={() => setLf(f => ({ ...f, place_type: f.place_type === pt ? '' : pt }))}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Roboto, sans-serif', border: '1px solid ' + (lf.place_type === pt ? T.blue : T.border), background: lf.place_type === pt ? T.blueSoft : T.white, color: lf.place_type === pt ? T.blue : T.muted }}>{pt}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Tags</label>
            {Object.entries(TAG_GROUPS).map(([group, tags]) => (
              <div key={group} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: T.muted, textTransform: 'uppercase', marginBottom: 8 }}>{group}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {tags.map(tag => (
                    <button key={tag} onClick={() => setLf(f => ({ ...f, tags: toggle(f.tags, tag) }))}
                      style={{ padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'Roboto, sans-serif', border: '1px solid ' + (lf.tags.includes(tag) ? T.blue : T.border), background: lf.tags.includes(tag) ? T.blueSoft : T.white, color: lf.tags.includes(tag) ? T.blue : T.muted }}>{tag}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Notes</label>
            <textarea value={lf.notes} onChange={e => setLf(f => ({ ...f, notes: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8, marginBottom: 32 }}>
            <button onClick={() => { setForm(lf); savePlace() }} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Saving...' : editingId ? 'Save Changes' : 'Add to Map Out'}
            </button>
            {editingId && <button onClick={() => deletePlace(editingId)} style={{ ...btnDanger, width: 'auto', marginBottom: 0 }}>Delete</button>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'Roboto, sans-serif', paddingBottom: 40 }}>
      {view !== 'add' && <Header />}
      {view === 'list'       && <ListView />}
      {view === 'detail'     && <DetailView />}
      {view === 'yeslist'    && <YesListView />}
      {view === 'yesdetail'  && <YesDetailView />}
      {view === 'completed'  && <CompletedView />}
      {view === 'compdetail' && <CompDetailView />}
      {view === 'add'        && <FormView />}
      {view === 'review'     && <ReviewView />}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: T.text, color: T.white, padding: '12px 24px', borderRadius: 24, fontSize: 14, fontWeight: 500, zIndex: 100, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>{toast}</div>
      )}
    </div>
  )
}


import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";

const TRIP_LABELS = ["Pending", "Scheduled", "Completed"];

const TAG_GROUPS = [
  {
    group: "Who's it for?", single: true,
    tags: [{ label: "Family", emoji: "👨‍👩‍👧" }, { label: "Kids", emoji: "🧒" }, { label: "Adults Only", emoji: "🍷" }],
  },
  {
    group: "Vibe", single: false,
    tags: [{ label: "Restaurant", emoji: "🍽️" }, { label: "Brunch", emoji: "🥂" }, { label: "Date Night", emoji: "✨" }, { label: "Thrift Shop", emoji: "🛍️" }],
  },
  {
    group: "Season", single: false,
    tags: [{ label: "Spring", emoji: "🌸" }, { label: "Summer", emoji: "☀️" }, { label: "Autumn", emoji: "🍂" }, { label: "Winter", emoji: "❄️" }, { label: "Year-round", emoji: "🔄" }],
  },
  {
    group: "Time of Day", single: false,
    tags: [{ label: "Morning", emoji: "🌅" }, { label: "Night", emoji: "🌙" }, { label: "Open Late", emoji: "🕛" }],
  },
  {
    group: "Price", single: true,
    tags: [{ label: "Free", emoji: "🎉" }, { label: "Paid", emoji: "💳" }],
  },
  {
    group: "Reservations", single: true,
    tags: [{ label: "No Reservations", emoji: "🚪" }, { label: "Reservations Required", emoji: "📋" }],
  },
  {
    group: "Getting There", single: true,
    tags: [{ label: "Drive", emoji: "🚗" }, { label: "Fly", emoji: "✈️" }],
  },
  {
    group: "Visit Type", single: true,
    tags: [{ label: "One-Time", emoji: "🎯" }, { label: "Regular Spot", emoji: "🔁" }],
  },
];

const ALL_TAGS = TAG_GROUPS.flatMap(g => g.tags);
const FILTER_TABS = ["All", "Undecided", "We're In", "Completed", "Family", "Adults Only", "Date Night", "Brunch", "Restaurant", "Thrift Shop", "Free", "Drive", "Fly", "Morning", "Night", "Open Late"];

const font = "'Roboto', sans-serif";
const serif = "'Playfair Display', serif";
const C = {
  bg: "#f8f9fc", surface: "#ffffff", border: "#e4e8f0",
  blue: "#4a7fe0", blueDark: "#2f5cb8", blueLight: "#eef3fd", blueMid: "#c5d7f8",
  text: "#1a1e2e", textSub: "#6b7280", textMuted: "#9ca3af",
  green: "#2d9e6b", greenBg: "#edf7f2", greenBorder: "#a3d9bf",
  red: "#d95b5b", redBg: "#fdf0f0", redBorder: "#f0b8b8",
  yellow: "#f59e0b",
};

function mapsUrl(location) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

function inputSx(extra = {}) {
  return { width: "100%", boxSizing: "border-box", background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 10, color: C.text, padding: "10px 13px", fontSize: 13, fontFamily: font, outline: "none", resize: "none", ...extra };
}

function FieldLabel({ children }) {
  return <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 5, fontFamily: font, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700 }}>{children}</div>;
}

function Field({ label, value, onChange, multiline, placeholder }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <FieldLabel>{label}</FieldLabel>
      {multiline ? <textarea rows={2} value={value} onChange={e => onChange(e.target.value)} style={inputSx()} placeholder={placeholder} /> : <input type="text" value={value} onChange={e => onChange(e.target.value)} style={inputSx()} placeholder={placeholder} />}
    </div>
  );
}

function NameField({ value, onChange, nameError }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <FieldLabel>Place Name *</FieldLabel>
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", boxSizing: "border-box", background: C.bg, border: `1.5px solid ${nameError ? C.red : C.border}`, borderRadius: 10, color: C.text, padding: "10px 13px", fontSize: 13, fontFamily: font, outline: "none" }}
        placeholder="e.g. Crowders Mountain" />
      {nameError && <div style={{ fontSize: 12, color: C.red, marginTop: 5, fontFamily: font, fontWeight: 600 }}>Please enter a place name before saving.</div>}
    </div>
  );
}

function TagPill({ label, emoji, active, onClick }) {
  return (
    <button onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 999, border: active ? `1.5px solid ${C.blue}` : `1.5px solid ${C.border}`, background: active ? C.blueLight : C.surface, color: active ? C.blue : C.textSub, fontSize: 12, cursor: "pointer", fontFamily: font, fontWeight: active ? 600 : 400, whiteSpace: "nowrap" }}>
      {emoji && <span style={{ fontSize: 13 }}>{emoji}</span>}{label}
    </button>
  );
}

function TagSection({ tags, setTags }) {
  function toggle(label, isSingle, groupTags) {
    setTags(prev => {
      if (isSingle) { const gl = groupTags.map(t => t.label); const base = prev.filter(t => !gl.includes(t)); return prev.includes(label) ? base : [...base, label]; }
      return prev.includes(label) ? prev.filter(t => t !== label) : [...prev, label];
    });
  }
  return (
    <div style={{ marginBottom: 14 }}>
      <FieldLabel>Tags</FieldLabel>
      {TAG_GROUPS.map(group => (
        <div key={group.group} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: C.textMuted, fontFamily: font, marginBottom: 6, letterSpacing: 0.5, fontWeight: 600 }}>{group.group}{group.single ? " · pick one" : ""}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {group.tags.map(t => <TagPill key={t.label} label={t.label} emoji={t.emoji} active={tags.includes(t.label)} onClick={() => toggle(t.label, group.single, group.tags)} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function StarRating({ rating, onRate }) {
  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 10, color: C.textMuted, fontFamily: font, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700, marginBottom: 7 }}>Your Rating</div>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {[1,2,3,4,5].map(star => (
          <button key={star} onClick={() => onRate(rating === star ? 0 : star)} style={{ background: "none", border: "none", fontSize: 28, cursor: "pointer", color: star <= rating ? C.yellow : "#d1d5db", padding: "0 1px", lineHeight: 1 }}>★</button>
        ))}
        {rating > 0 && <span style={{ fontSize: 12, color: C.textSub, fontFamily: font, marginLeft: 6 }}>{rating}/5</span>}
      </div>
    </div>
  );
}

function TripStatusPicker({ tripStatus, onUpdate }) {
  const statuses = [
    { label: "Pending", color: "#b45309", bg: "#fef3c7", border: "#fcd34d" },
    { label: "Scheduled", color: C.blue, bg: C.blueLight, border: C.blueMid },
    { label: "Completed", color: C.green, bg: C.greenBg, border: C.greenBorder },
  ];
  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 10, color: C.textMuted, fontFamily: font, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700, marginBottom: 7 }}>Trip Status</div>
      <div style={{ display: "flex", gap: 6 }}>
        {statuses.map(s => {
          const active = tripStatus === s.label;
          return <button key={s.label} onClick={() => onUpdate(active ? null : s.label)} style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: `1.5px solid ${active ? s.border : C.border}`, background: active ? s.bg : C.bg, color: active ? s.color : "#4a4a5a", fontSize: 11, fontFamily: font, fontWeight: active ? 700 : 600, cursor: "pointer" }}>{s.label}</button>;
        })}
      </div>
    </div>
  );
}
function PlaceForm({ initial, onSave, onCancel, saveLabel = "Save", saving }) {
  const [name, setName] = useState(initial?.name || "");
  const [nameError, setNameError] = useState(false);
  const [location, setLocation] = useState(initial?.location || "");
  const [distance, setDistance] = useState(initial?.distance || "");
  const [cost, setCost] = useState(initial?.cost || "");
  const [website, setWebsite] = useState(initial?.website || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [link, setLink] = useState(initial?.link || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [tags, setTags] = useState(initial?.tags || []);
  return (
    <div>
      <NameField value={name} onChange={(v) => { setName(v); setNameError(false); }} nameError={nameError} />
      <Field label="Location / City" value={location} onChange={setLocation} placeholder="e.g. 123 Main St, Charlotte, NC" />
      <Field label="Distance from home" value={distance} onChange={setDistance} placeholder="e.g. 22 miles" />
      <Field label="Cost" value={cost} onChange={setCost} placeholder="e.g. Free · $15/person" />
      <Field label="Website" value={website} onChange={setWebsite} placeholder="https://..." />
      <Field label="Phone Number" value={phone} onChange={setPhone} placeholder="e.g. (704) 555-0123" />
      <Field label="Video / Reference Link" value={link} onChange={setLink} placeholder="Instagram, YouTube, TikTok…" />
      <Field label="Notes" value={description} onChange={setDescription} multiline placeholder="Why you saved it, tips, vibes…" />
      <TagSection tags={tags} setTags={setTags} />
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button disabled={saving} onClick={() => { if (name.trim()) { onSave({ name, location, distance, cost, website, phone, link, description, tags }); } else { setNameError(true); } }} style={{ flex: 1, padding: "13px 0", borderRadius: 12, border: "none", background: saving ? C.blueMid : `linear-gradient(135deg, ${C.blue}, ${C.blueDark})`, color: "#fff", fontSize: 14, fontFamily: font, fontWeight: 700, cursor: saving ? "default" : "pointer", boxShadow: saving ? "none" : `0 4px 16px ${C.blue}44` }}>{saving ? "Saving…" : saveLabel}</button>
        {onCancel && <button onClick={onCancel} style={{ flex: 1, padding: "13px 0", borderRadius: 12, border: `1.5px solid ${C.border}`, background: C.surface, color: "#4a4a5a", fontSize: 14, fontFamily: font, fontWeight: 600, cursor: "pointer" }}>Cancel</button>}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = { "We're In": { color: C.green, bg: C.greenBg }, "Pass": { color: C.red, bg: C.redBg }, "Undecided": { color: "#5a5f72", bg: "#e2e5ed" } };
  const s = map[status] || map["Undecided"];
  return <span style={{ fontSize: 11, fontFamily: font, fontWeight: 600, color: s.color, background: s.bg, padding: "3px 9px", borderRadius: 999, whiteSpace: "nowrap" }}>{status}</span>;
}

function PlaceCard({ place, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const isWeIn = place.status === "We're In";
  const tripStatus = place.tags?.find(t => TRIP_LABELS.includes(t)) || null;
  const rating = place.rating || 0;
  const barColor = isWeIn ? C.green : place.status === "Pass" ? C.red : C.blue;

  async function handleUpdate(updates) { setSaving(true); await onUpdate(place.id, updates); setSaving(false); setEditing(false); }

  function handleTripStatus(val) {
    const filtered = (place.tags || []).filter(t => !TRIP_LABELS.includes(t));
    const newTags = val ? [...filtered, val] : filtered;
    onUpdate(place.id, { tags: newTags });
  }

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 16px 14px", marginBottom: 10, position: "relative", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: barColor, borderRadius: "4px 0 0 4px" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div style={{ flex: 1, paddingRight: 8 }}>
          <div style={{ fontFamily: serif, fontSize: 16, color: C.text, fontWeight: 600, lineHeight: 1.3 }}>{place.name}</div>
          {(place.location || place.distance) && (
            <a href={place.location ? mapsUrl(place.location) : "#"} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12, color: C.blue, marginTop: 3, fontFamily: font, fontWeight: 500, textDecoration: "none" }}>
              📍 {[place.location, place.distance].filter(Boolean).join(" · ")} <span style={{ fontSize: 10 }}>↗</span>
            </a>
          )}
        </div>
        <StatusBadge status={place.status} />
      </div>
      {(place.cost || place.website || place.phone || place.link) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 7 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
            {place.cost && <span style={{ fontSize: 12, color: C.textSub, fontFamily: font }}>💰 {place.cost}</span>}
            {place.phone && <a href={`tel:${place.phone}`} style={{ fontSize: 12, color: C.textSub, fontFamily: font, textDecoration: "none" }}>📞 {place.phone}</a>}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
            {place.website && <a href={place.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.blue, fontFamily: font, fontWeight: 600, textDecoration: "none" }}>🌐 Website ↗</a>}
            {place.link && <a href={place.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.blue, fontFamily: font, fontWeight: 600, textDecoration: "none" }}>🎬 Watch reference ↗</a>}
          </div>
        </div>
      )}
      {place.description && <p style={{ fontSize: 12, color: C.textSub, lineHeight: 1.6, margin: "8px 0 4px", fontFamily: font }}>{place.description}</p>}
      {place.tags?.filter(t => !TRIP_LABELS.includes(t)).length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 10, marginBottom: 10 }}>
          {place.tags.filter(t => !TRIP_LABELS.includes(t)).map(tag => {
            const t = ALL_TAGS.find(t => t.label === tag);
            return <TagPill key={tag} label={tag} emoji={t?.emoji} active={false} onClick={() => {}} />;
          })}
        </div>
      )}
      {isWeIn && !editing && <TripStatusPicker tripStatus={tripStatus} onUpdate={handleTripStatus} />}
      {isWeIn && !editing && <StarRating rating={rating} onRate={(val) => onUpdate(place.id, { rating: val })} />}
      {!editing && (
        <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
          {[{ label: "✓ Yes", status: "We're In", activeC: C.green, activeBg: C.greenBg, activeBorder: C.greenBorder }, { label: "✗ Pass", status: "Pass", activeC: C.red, activeBg: C.redBg, activeBorder: C.redBorder }].map(({ label, status, activeC, activeBg, activeBorder }) => {
            const on = place.status === status;
            return <button key={status} onClick={() => onUpdate(place.id, { status: on ? "Undecided" : status })} style={{ flex: 1, padding: "9px 0", borderRadius: 9, border: `1.5px solid ${on ? activeBorder : "#c0c4d0"}`, background: on ? activeBg : "#edeef2", color: on ? activeC : "#2a2a3a", fontSize: 13, fontFamily: font, fontWeight: 700, cursor: "pointer" }}>{label}</button>;
          })}
          <button onClick={() => setEditing(true)} style={{ width: 38, borderRadius: 9, border: "1.5px solid #c0c4d0", background: "#edeef2", color: "#2a2a3a", fontSize: 14, cursor: "pointer" }}>✏️</button>
          <button onClick={() => onDelete(place.id)} style={{ width: 38, borderRadius: 9, border: "1.5px solid #c0c4d0", background: "#edeef2", color: "#2a2a3a", fontSize: 14, cursor: "pointer" }}>🗑️</button>
        </div>
      )}
      {editing && <div style={{ marginTop: 14, borderTop: `1px solid ${C.border}`, paddingTop: 14 }}><PlaceForm initial={place} saveLabel="Save Changes" saving={saving} onSave={handleUpdate} onCancel={() => setEditing(false)} /></div>}
    </div>
  );
}

function AddModal({ onAdd, onClose }) {
  const [saving, setSaving] = useState(false);
  async function handleAdd(place) { setSaving(true); await onAdd(place); setSaving(false); onClose(); }
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(15,20,40,0.35)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end" }}>
      <div style={{ width: "100%", background: C.surface, borderRadius: "22px 22px 0 0", padding: "24px 20px 44px", borderTop: `1px solid ${C.border}`, maxHeight: "90vh", overflowY: "auto", boxSizing: "border-box", boxShadow: "0 -8px 40px rgba(0,0,0,0.12)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontFamily: serif, fontSize: 20, color: C.text, fontWeight: 700 }}>Add a Place</span>
          <button onClick={onClose} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 999, color: "#2a2a3a", fontSize: 16, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <PlaceForm saveLabel="Add to WanderList" saving={saving} onSave={handleAdd} onCancel={onClose} />
      </div>
    </div>
  );
}

export default function App() {
  const [places, setPlaces] = useState([]);
  const [filter, setFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPlaces();
    const channel = supabase.channel('places-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'places' }, () => { fetchPlaces(); }).subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  async function fetchPlaces() {
    const { data, error } = await supabase.from('places').select('*').order('created_at', { ascending: false });
    if (error) { setError("Couldn't connect to database."); } else { setPlaces(data || []); }
    setLoading(false);
  }

  async function addPlace(place) {
    const { error } = await supabase.from('places').insert([{
      name: place.name, location: place.location || null, distance: place.distance || null,
      cost: place.cost || null, website: place.website || null, phone: place.phone || null,
      link: place.link || null, description: place.description || null,
      tags: place.tags, status: 'Undecided', rating: 0,
    }]);
    if (error) { alert("Error: " + error.message); return; }
    await fetchPlaces();
  }

  async function updatePlace(id, updates) {
    const { error } = await supabase.from('places').update(updates).eq('id', id);
    if (error) { alert("Error: " + error.message); return; }
    await fetchPlaces();
  }

  async function deletePlace(id) {
    if (!confirm("Remove this place?")) return;
    const { error } = await supabase.from('places').delete().eq('id', id);
    if (error) { alert("Error: " + error.message); return; }
    await fetchPlaces();
  }

  const filtered = places.filter(p => {
    if (filter === "All") return true;
    if (filter === "Undecided") return p.status === "Undecided";
    if (filter === "We're In") return p.status === "We're In";
    if (filter === "Completed") return p.tags?.includes("Completed");
    return p.tags?.includes(filter);
  });

  const total = places.length;
  const inCount = places.filter(p => p.status === "We're In").length;
  const undecided = places.filter(p => p.status === "Undecided").length;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: font, maxWidth: 480, margin: "0 auto" }}>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 260, pointerEvents: "none", zIndex: 0, background: `linear-gradient(180deg, ${C.blueLight} 0%, transparent 100%)` }} />
      <div style={{ position: "relative", zIndex: 1, paddingBottom: 100 }}>
        <div style={{ padding: "52px 20px 18px" }}>
          <div style={{ fontSize: 10, color: C.blue, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4, fontWeight: 700 }}>Your Wishlist</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ fontFamily: serif, fontSize: 34, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1, color: C.text }}>WanderList</div>
            <button onClick={() => setShowAdd(true)} style={{ padding: "10px 18px", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${C.blue}, ${C.blueDark})`, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font, boxShadow: `0 4px 14px ${C.blue}44` }}>+ Add Place</button>
          </div>
          <div style={{ display: "flex", gap: 0, marginTop: 20, background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            {[["TOTAL", total, C.text], ["WE'RE IN", inCount, C.green], ["TO DECIDE", undecided, C.blue]].map(([lbl, val, color], i, arr) => (
              <div key={lbl} style={{ flex: 1, padding: "14px 0", textAlign: "center", borderRight: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ fontSize: 24, fontWeight: 700, color, fontFamily: serif, lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: 9, color: C.textMuted, letterSpacing: 1.5, marginTop: 4, fontWeight: 700 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ overflowX: "auto", paddingLeft: 20, paddingBottom: 14 }}>
          <div style={{ display: "flex", gap: 7, minWidth: "max-content", paddingRight: 20 }}>
            {FILTER_TABS.map(tab => { const on = filter === tab; return <button key={tab} onClick={() => setFilter(tab)} style={{ padding: "7px 15px", borderRadius: 999, border: `1.5px solid ${on ? C.blue : C.border}`, background: on ? C.blueLight : C.surface, color: on ? C.blue : "#4a4a5a", fontSize: 12, fontWeight: on ? 700 : 600, cursor: "pointer", fontFamily: font, whiteSpace: "nowrap" }}>{tab}</button>; })}
          </div>
        </div>
        <div style={{ height: 1, background: C.border, marginBottom: 14, marginLeft: 20, marginRight: 20 }} />
        <div style={{ padding: "0 14px" }}>
          {error ? <div style={{ margin: "20px 0", padding: 16, borderRadius: 12, background: C.redBg, border: `1px solid ${C.redBorder}`, fontFamily: font, fontSize: 13, color: C.red }}>⚠️ {error}</div>
          : loading ? <div style={{ textAlign: "center", padding: "60px 20px", color: C.textMuted, fontFamily: font }}>Loading your places…</div>
          : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🗺️</div>
              <div style={{ fontFamily: serif, fontSize: 18, color: C.textSub, marginBottom: 6 }}>{places.length === 0 ? "Your list is empty" : "Nothing here yet"}</div>
              <div style={{ fontSize: 12, color: C.textMuted }}>{places.length === 0 ? "Tap + Add Place to get started" : "Try a different filter"}</div>
            </div>
          ) : filtered.map(place => <PlaceCard key={place.id} place={place} onUpdate={updatePlace} onDelete={deletePlace} />)}
        </div>
      </div>
      {showAdd && <AddModal onAdd={addPlace} onClose={() => setShowAdd(false)} />}
    </div>
  );
}

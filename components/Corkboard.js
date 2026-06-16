import { useEffect, useState } from 'react'

export default function Corkboard() {
  const [notes, setNotes] = useState([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    // local demo-only storage
    const raw = localStorage.getItem('notes')
    if (raw) setNotes(JSON.parse(raw))
  }, [])

  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes))
  }, [notes])

  function add(e) {
    e.preventDefault()
    setNotes([{ id: Date.now(), title, content }, ...notes])
    setTitle('')
    setContent('')
  }

  return (
    <div>
      <form onSubmit={add} className="mb-2">
        <input placeholder="Judul" value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full border p-1 mb-1" />
        <textarea placeholder="Isi catatan" value={content} onChange={(e)=>setContent(e.target.value)} className="w-full border p-1 mb-1" />
        <button className="bg-green-600 text-white px-3 py-1 rounded">Tambah</button>
      </form>
      <div className="space-y-2">
        {notes.map(n => (
          <div key={n.id} className="p-2 bg-yellow-50 border rounded"> 
            <strong>{n.title}</strong>
            <div className="text-sm">{n.content}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

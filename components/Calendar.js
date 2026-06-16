import { useEffect, useMemo, useRef, useState } from 'react'

export default function Calendar() {
  const now = new Date()
  const [yearNow, setYearNow] = useState(now.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(new Date(yearNow, 11, 1))
  const [events, setEvents] = useState([])
  const [openDate, setOpenDate] = useState(null)
  const [showDateModal, setShowDateModal] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [showYearModal, setShowYearModal] = useState(false)
  const [showMonthModal, setShowMonthModal] = useState(false)
  const yearWheelRef = useRef(null)
  const monthWheelRef = useRef(null)
  const [form, setForm] = useState({ id: null, title: '', timeInput: '', location: '', details: '', date: '' })
  const [warning, setWarning] = useState('')
  const [showPastError, setShowPastError] = useState(false)
  const [nowTick, setNowTick] = useState(Date.now())
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [confirmDeleteTitle, setConfirmDeleteTitle] = useState('')

  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
  const monthsFull = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
  const daysFull = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu']
  const daysShort = ['SU','MO','TU','WE','TH','FR','SA']

  const endYear = useMemo(() => {
    const s = localStorage.getItem('calendarEndYear')
    const ey = s ? Number(s) : yearNow + 2
    return ey
  }, [yearNow])

  const startYear = useMemo(() => {
    const s = localStorage.getItem('calendarStartYear')
    const sy = s ? Number(s) : yearNow
    return sy
  }, [yearNow])

  useEffect(() => {
    const y = currentMonth.getFullYear()
    const m = currentMonth.getMonth() + 1
    const from = `${y}-${pad2(m)}-01`
    const last = new Date(y, m, 0).getDate()
    const to = `${y}-${pad2(m)}-${pad2(last)}`
    ;(async () => {
      try {
        const r = await fetch(`/api/calendar?from=${from}&to=${to}`)
        let serverList = []
        if (r.ok) serverList = await r.json()
        try {
          const rawLocal = localStorage.getItem('calendarEvents')
          const localList = rawLocal ? JSON.parse(rawLocal) : []
          const inRange = localList.filter((e) => e.date >= from && e.date <= to)
          const exists = new Set(serverList.map((e) => `${e.date}-${e.time24}`))
          for (const e of inRange) {
            const key = `${e.date}-${e.time24}`
            if (!exists.has(key)) {
              const body = { date: e.date, title: e.title, timeLabel: e.timeLabel, time24: e.time24, location: e.location || null, details: e.details || null }
              const pr = await fetch('/api/calendar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
              if (pr.ok) {
                const created = await pr.json()
                serverList.push(created)
                exists.add(key)
              }
            }
          }
        } catch {}
        setEvents(serverList)
      } catch {}
    })()
  }, [currentMonth])

  useEffect(() => {
    const t = setInterval(() => {
      const ny = new Date().getFullYear()
      if (ny !== yearNow) setYearNow(ny)
      setNowTick(Date.now())
    }, 60000)
    return () => clearInterval(t)
  }, [yearNow])

  function saveEvents(next) {
    setEvents(next)
  }

  function openDay(dateStr) {
    setOpenDate(dateStr)
    setShowDateModal(true)
    setShowFormModal(false)
    setWarning('')
  }

  function closeDateModal() {
    setShowDateModal(false)
    setOpenDate(null)
  }

  function openNewForm() {
    setForm({ id: null, title: '', timeInput: '', location: '', details: '', date: openDate })
    setShowFormModal(true)
    setWarning('')
  }

  function openEventDetail(e) {
    setForm({ id: e.id, title: e.title, timeInput: e.timeLabel, location: e.location || '', details: e.details || '', date: e.date })
    setShowFormModal(true)
    setWarning('')
  }

  function openDeleteConfirm(e) {
    setConfirmDeleteId(e.id)
    setConfirmDeleteTitle(`${e.timeLabel} | ${e.title}`)
  }

  function cancelDeleteConfirm() {
    setConfirmDeleteId(null)
    setConfirmDeleteTitle('')
  }

  async function confirmDeleteEvent() {
    if (!confirmDeleteId) return
    try {
      const r = await fetch(`/api/calendar/${confirmDeleteId}`, { method: 'DELETE' })
      if (r.ok) {
        const next = events.filter((ev) => ev.id !== confirmDeleteId)
        saveEvents(next)
      }
    } finally {
      setConfirmDeleteId(null)
      setConfirmDeleteTitle('')
    }
  }

  function pad2(n) {
    return String(n).padStart(2, '0')
  }

  function normalizeTimeInput(raw) {
    if (!raw) return ''
    const trimmed = String(raw).trim()
    const s = trimmed.replace(/\s+/g, '').toLowerCase()
    // Case 1: already in HH:MM with optional am/pm
    let m = s.match(/^(\d{1,2}):(\d{2})(am|pm)?$/)
    if (m) {
      let h = Number(m[1])
      let mm = Number(m[2])
      if (mm > 59) mm = 59
      if (h > 23) h = 23
      const suf = m[3] ? (m[3] === 'pm' ? 'PM' : 'AM') : (h >= 12 ? 'PM' : 'AM')
      return `${pad2(h)}:${pad2(mm)} ${suf}`
    }
    // Case 2: digits only like 1320 or 930 with optional am/pm
    m = s.match(/^(\d{1,4})(am|pm)?$/)
    if (m) {
      const digits = m[1]
      const suffixRaw = m[2]
      let h = 0
      let mm = 0
      if (digits.length <= 2) {
        h = Number(digits)
        mm = 0
      } else {
        h = Number(digits.slice(0, digits.length - 2))
        mm = Number(digits.slice(-2))
      }
      if (mm > 59) mm = 59
      if (h > 23) h = 23
      const suf = suffixRaw ? (suffixRaw === 'pm' ? 'PM' : 'AM') : (h >= 12 ? 'PM' : 'AM')
      return `${pad2(h)}:${pad2(mm)} ${suf}`
    }
    // Case 3: HH or HH:MM without am/pm treated as 24h, add suffix automatically
    m = s.match(/^(\d{1,2})(:(\d{2}))?$/)
    if (m) {
      let h = Number(m[1])
      let mm = m[3] ? Number(m[3]) : 0
      if (mm > 59) mm = 59
      if (h > 23) h = 23
      const suf = h >= 12 ? 'PM' : 'AM'
      return `${pad2(h)}:${pad2(mm)} ${suf}`
    }
    // Fallback: return original trimmed, do not clear user input
    return trimmed
  }

  function labelTo24(label) {
    const s = String(label).trim().toLowerCase()
    let m = s.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/)
    if (m) {
      let h = Number(m[1])
      const mm = Number(m[2])
      const suf = m[3]
      if (suf === 'am') {
        if (h === 12) h = 0
      } else {
        if (h < 12) h += 12
      }
      return `${pad2(h)}:${pad2(mm)}`
    }
    // Accept HH:MM without suffix as 24h
    m = s.match(/^(\d{1,2}):(\d{2})$/)
    if (m) {
      let h = Number(m[1])
      let mm = Number(m[2])
      if (mm > 59) mm = 59
      if (h > 23) h = 23
      return `${pad2(h)}:${pad2(mm)}`
    }
    return null
  }

  function isPast(dateStr, timeLabel) {
    const m = labelTo24(timeLabel)
    if (!m) return false
    const [hh, mm] = m.split(':').map(Number)
    const d = new Date(dateStr + 'T' + pad2(hh) + ':' + pad2(mm) + ':00')
    return d.getTime() < Date.now()
  }

  async function saveForm() {
    const label = normalizeTimeInput(form.timeInput)
    if (!form.title || !label) {
      setWarning('Judul dan Jam wajib diisi')
      return
    }
    const time24 = labelTo24(label)
    if (!time24) {
      setWarning('Format jam tidak valid')
      return
    }
    const list = events.filter((e) => e.date === form.date)
    const dup = list.find((e) => e.time24 === time24 && (!form.id || e.id !== form.id))
    if (dup) {
      setWarning('Tidak bisa pilih di jam yang sama')
      return
    }
    const past = isPast(form.date, label)
    if (past) {
      setShowPastError(true)
      return
    }
    try {
      if (form.id) {
        const r = await fetch(`/api/calendar/${form.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: form.date, title: form.title, timeLabel: label, time24, location: form.location, details: form.details })
        })
        if (r.ok) {
          const updated = await r.json()
          const next = events.map((e) => e.id === form.id ? updated : e)
          saveEvents(next)
        }
      } else {
        const r = await fetch('/api/calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: form.date, title: form.title, timeLabel: label, time24, location: form.location, details: form.details })
        })
        if (r.ok) {
          const created = await r.json()
          const next = [created, ...events]
          saveEvents(next)
        }
      }
    } catch {}
    setShowFormModal(false)
    setWarning('')
  }

  function monthBounds() {
    return { min: new Date(startYear, 0, 1), max: new Date(endYear, 11, 1) }
  }

  useEffect(() => {
    if (showYearModal && yearWheelRef.current) {
      const idx = currentMonth.getFullYear() - startYear
      yearWheelRef.current.scrollTop = Math.max(0, idx * 40 - 80)
    }
  }, [showYearModal])

  useEffect(() => {
    if (showMonthModal && monthWheelRef.current) {
      const idx = currentMonth.getMonth()
      monthWheelRef.current.scrollTop = Math.max(0, idx * 40 - 80)
    }
  }, [showMonthModal])

  function prevMonth() {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    const { min } = monthBounds()
    if (d < min) return
    setCurrentMonth(d)
  }

  function nextMonth() {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    const { max } = monthBounds()
    if (d > max) return
    setCurrentMonth(d)
  }

  function daysForMonth(y, m) {
    const first = new Date(y, m, 1)
    const startWeekday = first.getDay()
    const total = new Date(y, m + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < startWeekday; i++) cells.push(null)
    for (let d = 1; d <= total; d++) cells.push(new Date(y, m, d))
    return cells
  }

  function dateStr(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
  }

  const todayStr = useMemo(() => {
    return dateStr(new Date())
  }, [])

  const monthCells = useMemo(() => {
    const y = currentMonth.getFullYear()
    const m = currentMonth.getMonth()
    const cells = daysForMonth(y, m)
    return cells.map((d) => {
      if (!d) return { empty: true }
      const ds = dateStr(d)
      const has = events.some((e) => e.date === ds)
      const isToday = ds === todayStr
      return { empty: false, d, has, isToday, ds }
    })
  }, [currentMonth, events])

  const modalList = useMemo(() => {
    if (!openDate) return []
    return events.filter((e) => e.date === openDate).sort((a, b) => a.time24.localeCompare(b.time24))
  }, [openDate, events])

  const modalHeader = useMemo(() => {
    if (!openDate) return ''
    const [y, m, d] = openDate.split('-').map(Number)
    return `${monthsFull[m - 1]} ${pad2(d)}`
  }, [openDate])

  const modalSubHeader = useMemo(() => {
    if (!openDate) return ''
    const [y, m, d] = openDate.split('-').map(Number)
    const dt = new Date(y, m - 1, d)
    const dayName = daysFull[dt.getDay()]
    return dayName
  }, [openDate])

  const inPastView = useMemo(() => {
    if (!form.date || !form.timeInput) return false
    return isPast(form.date, normalizeTimeInput(form.timeInput))
  }, [form])

  function isPastDate(ds) {
    const [y, m, d] = ds.split('-').map(Number)
    const t = new Date(y, m - 1, d, 23, 59, 59).getTime()
    return t < Date.now()
  }

  return (
    <div>
      <div className="flex items-center justify-center mb-2">
        <button onClick={() => setShowYearModal(true)} className="text-2xl font-bold px-4 py-1 bg-white border border-green-600 text-green-700 rounded-lg shadow-sm hover:bg-green-50">
          {currentMonth.getFullYear()}
        </button>
      </div>
      <div className="flex items-center justify-center gap-3 mb-3">
        <button onClick={prevMonth} aria-label="Bulan sebelumnya" className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-green-600 hover:bg-green-700 shadow-sm">
          <img src="/images/Direction%20icon.svg" alt="Kiri" className="w-4 h-4 sm:w-5 sm:h-5" onError={(e)=>{ e.currentTarget.style.display='none'; if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.classList.remove('hidden') }} />
          <span className="hidden text-white text-lg leading-none">‹</span>
        </button>
        <button onClick={() => setShowMonthModal(true)} className="font-semibold uppercase px-4 py-1 bg-white border border-green-600 text-green-700 rounded-lg shadow-sm hover:bg-green-50">{monthsFull[currentMonth.getMonth()]}</button>
        <button onClick={nextMonth} aria-label="Bulan berikutnya" className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-green-600 hover:bg-green-700 shadow-sm">
          <img src="/images/Direction%20icon.svg" alt="Kanan" className="w-4 h-4 sm:w-5 sm:h-5 transform rotate-180" onError={(e)=>{ e.currentTarget.style.display='none'; if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.classList.remove('hidden') }} />
          <span className="hidden text-white text-lg leading-none">›</span>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0 text-xs mb-1 border border-green-600 rounded-t-lg overflow-hidden">
        {daysShort.map((d) => (
          <div key={d} className="text-center font-semibold p-1 border border-green-600">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0 border border-green-600 rounded-b-lg overflow-hidden">
        {monthCells.map((cell, idx) => (
          <div key={idx} className={`h-16 sm:h-20 md:h-24 relative ${cell.empty ? 'bg-gray-50' : 'bg-white'} border border-green-200`}>
            {!cell.empty && (
              <button onClick={() => openDay(dateStr(cell.d))} className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-center px-2 py-2 hover:bg-green-50 transition">
                <div className="text-base font-semibold">
                  <span className={cell.isToday ? 'inline-flex items-center justify-center w-6 h-6 rounded-full text-white' : ''} style={cell.isToday ? { background: '#2e7d32' } : {}}>
                    {cell.d.getDate()}
                  </span>
                </div>
                {cell.has && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full" style={{ background: '#2e7d32' }} />}
              </button>
            )}
          </div>
        ))}
      </div>

      {showDateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={closeDateModal}>
          <div className="bg-white rounded-lg shadow-lg p-6 w-96 transform transition-all" onClick={(e) => { e.stopPropagation() }}>
            <div className="font-bold text-lg mb-2">{modalHeader}</div>
            <div className="text-sm text-gray-500 mb-3">{modalSubHeader}</div>
            <div className="border-t border-green-600 my-3" />
            <div className="space-y-2 mb-3">
              {modalList.map((e) => (
                <div key={e.id} className="flex items-center justify-between p-2 rounded border hover:bg-gray-50">
                  <button onClick={() => openEventDetail(e)} className="flex-1 text-left">
                    <div className={isPast(e.date, e.timeLabel) ? 'line-through text-gray-400' : ''}>{e.timeLabel} | {e.title}</div>
                  </button>
                  {!isPast(e.date, e.timeLabel) && (
                    <button onClick={() => openDeleteConfirm(e)} className="ml-2 text-red-600 hover:text-red-800" aria-label="Hapus">
                      <img src="/images/trash%20icon.svg" alt="Hapus" className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              {modalList.length === 0 && <div className="text-sm text-gray-500">(isi acara tanggal tersebut)</div>}
            </div>
            {!isPastDate(openDate) && (
              <div className="flex justify-end">
                <button onClick={openNewForm} className="px-4 py-2 rounded text-white flex items-center justify-center" style={{ background: '#2e7d32' }} aria-label="Tambah">
                  <img src="/images/add%20icon.svg" alt="Tambah" className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showFormModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowFormModal(false)}>
          <div className="bg-white rounded-lg shadow-lg p-6 w-96 transform transition-all" onClick={(e) => { e.stopPropagation() }}>
            <div className="space-y-2 mb-4">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Judul" className="w-full border p-2 rounded" />
              <input value={form.timeInput} onChange={(e) => setForm({ ...form, timeInput: e.target.value })} onBlur={(e) => { const v = normalizeTimeInput(e.target.value); setForm({ ...form, timeInput: v || e.target.value }); }} placeholder="Masukkan jam, contoh 1320 am atau 1720" className="w-full border p-2 rounded" />
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Lokasi" className="w-full border p-2 rounded" />
              <textarea value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="Info Detail" className="w-full border p-2 rounded h-24" />
            </div>
            {warning && <div className="text-red-600 text-sm mb-3">{warning}</div>}
            <div className="flex justify-end gap-2">
              <button onClick={saveForm} className="px-4 py-2 rounded text-white flex items-center justify-center" style={{ background: '#2e7d32' }} aria-label="Simpan">
                <img src="/images/save%20icon.svg" alt="Simpan" className="w-5 h-5" />
              </button>
              <button onClick={() => setShowFormModal(false)} className="px-4 py-2 rounded bg-gray-200 text-gray-800 flex items-center justify-center" aria-label="Tutup">
                <img src="/images/close%20icon.svg" alt="Tutup" className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showPastError && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowPastError(false)}>
          <div className="bg-white rounded-lg shadow-lg p-6 w-80" onClick={(e)=>e.stopPropagation()}>
            <div className="font-bold text-lg mb-2">Waktu Sudah Lewat</div>
            <div className="text-sm text-gray-700 mb-4">Jam yang diatur sudah lewat. Silakan pilih jam yang belum lewat untuk tanggal ini.</div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowPastError(false)} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <div className="font-bold text-lg mb-2">Konfirmasi Hapus</div>
            <div className="text-sm text-gray-700 mb-4">Anda yakin ingin menghapus acara <span className="font-semibold">{confirmDeleteTitle}</span>?</div>
            <div className="flex gap-2 justify-end">
              <button onClick={cancelDeleteConfirm} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Batal</button>
              <button onClick={confirmDeleteEvent} className="px-4 py-2 rounded text-white" style={{ background: '#d32f2f' }}>Hapus</button>
            </div>
          </div>
        </div>
      )}

      {showYearModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowYearModal(false)}>
          <div className="bg-white rounded-lg shadow-lg p-6 w-80" onClick={(e)=>e.stopPropagation()}>
            <div className="font-bold text-lg mb-3">Pilih Tahun</div>
            <div ref={yearWheelRef} className="relative h-48 overflow-y-auto">
              <div className="pointer-events-none absolute top-1/2 left-0 right-0 -translate-y-1/2 h-10 border border-green-600 rounded"></div>
              {Array.from({ length: (endYear - startYear + 1) }, (_, i) => startYear + i).map((y) => (
                <button key={y} onClick={()=>{ setCurrentMonth(new Date(y, currentMonth.getMonth(), 1)); setShowYearModal(false) }} className={`w-full h-10 flex items-center justify-center ${y===currentMonth.getFullYear()?'text-green-700 font-bold':'text-gray-700'}`}>{y}</button>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button className="px-4 py-2 rounded bg-gray-200 text-gray-800" onClick={()=>setShowYearModal(false)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {showMonthModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowMonthModal(false)}>
          <div className="bg-white rounded-lg shadow-lg p-6 w-80" onClick={(e)=>e.stopPropagation()}>
            <div className="font-bold text-lg mb-3">Pilih Bulan</div>
            <div ref={monthWheelRef} className="relative h-48 overflow-y-auto">
              <div className="pointer-events-none absolute top-1/2 left-0 right-0 -translate-y-1/2 h-10 border border-green-600 rounded"></div>
              {monthsFull.map((m, idx) => (
                <button key={m} onClick={()=>{ setCurrentMonth(new Date(currentMonth.getFullYear(), idx, 1)); setShowMonthModal(false) }} className={`w-full h-10 flex items-center justify-center uppercase ${idx===currentMonth.getMonth()?'text-green-700 font-bold':'text-gray-700'}`}>{m}</button>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button className="px-4 py-2 rounded bg-gray-200 text-gray-800" onClick={()=>setShowMonthModal(false)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

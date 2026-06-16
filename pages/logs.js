import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import Pagination from '../components/Pagination'

export default function LogsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [logs, setLogs] = useState([])
  const [logsPage, setLogsPage] = useState(1)
  const [confirmClear, setConfirmClear] = useState(false)
  const [noteLogs, setNoteLogs] = useState([])
  const [noteLogsPage, setNoteLogsPage] = useState(1)
  const [confirmClearNotes, setConfirmClearNotes] = useState(false)
  const [settingsLogs, setSettingsLogs] = useState([])
  const [settingsLogsPage, setSettingsLogsPage] = useState(1)
  const [confirmClearSettings, setConfirmClearSettings] = useState(false)
  const [productLogs, setProductLogs] = useState([])
  const [productLogsPage, setProductLogsPage] = useState(1)
  const [confirmClearProducts, setConfirmClearProducts] = useState(false)
  const [financeLogs, setFinanceLogs] = useState([])
  const [financeLogsPage, setFinanceLogsPage] = useState(1)
  const [confirmClearFinance, setConfirmClearFinance] = useState(false)

  useEffect(() => {
    async function init() {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/login')
        return
      }
      const data = await res.json()
      setUser(data.user)
      refresh()
    }
    init()
  }, [])

  function refresh() {
    fetch('/api/stocks/logs').then((r) => r.json()).then(setLogs)
    fetch('/api/notes/logs').then((r) => r.json()).then(setNoteLogs)
    fetch('/api/settings/logs').then((r)=>r.json()).then(setSettingsLogs)
    fetch('/api/products/logs').then((r)=>r.json()).then(setProductLogs)
    fetch('/api/finance/logs').then((r)=>r.json()).then(setFinanceLogs)
  }

  if (!user) return <div>Loading...</div>

  const totalPages = Math.max(1, Math.ceil(logs.length / 8))
  const currentPage = Math.min(logsPage, totalPages)
  const start = (currentPage - 1) * 8
  const pageItems = logs.slice(start, start + 8)

  const totalPagesNotes = Math.max(1, Math.ceil(noteLogs.length / 8))
  const currentPageNotes = Math.min(noteLogsPage, totalPagesNotes)
  const startNotes = (currentPageNotes - 1) * 8
  const pageItemsNotes = noteLogs.slice(startNotes, startNotes + 8)

  const totalPagesSettings = Math.max(1, Math.ceil(settingsLogs.length / 8))
  const currentPageSettings = Math.min(settingsLogsPage, totalPagesSettings)
  const startSettings = (currentPageSettings - 1) * 8
  const pageItemsSettings = settingsLogs.slice(startSettings, startSettings + 8)

  const totalPagesProducts = Math.max(1, Math.ceil(productLogs.length / 8))
  const currentPageProducts = Math.min(productLogsPage, totalPagesProducts)
  const startProducts = (currentPageProducts - 1) * 8
  const pageItemsProducts = productLogs.slice(startProducts, startProducts + 8)

  const totalPagesFinance = Math.max(1, Math.ceil(financeLogs.length / 8))
  const currentPageFinance = Math.min(financeLogsPage, totalPagesFinance)
  const startFinance = (currentPageFinance - 1) * 8
  const pageItemsFinance = financeLogs.slice(startFinance, startFinance + 8)

  return (
    <Layout user={user}>
      <h1 className="text-3xl font-bold mb-6" style={{ color: '#2e7d32' }}>Logs</h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Log Aktivitas Stock</h2>
        </div>

        <div className="space-y-2 text-sm">
          {pageItems.map((log) => (
            <div key={log.id} className="border-l-2 border-blue-400 pl-2 py-1">
              <div className="whitespace-pre-wrap text-gray-800">{(log.note ? log.note : `${log.action} ${log.quantity} ${log.unit}`).replace(/[()]/g, '')}</div>
              <div className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString('id-ID')}</div>
            </div>
          ))}
        </div>

        <div className="mt-3">
          <Pagination current={currentPage} total={totalPages} onChange={(p) => setLogsPage(p)} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Log Aktivitas Catatan</h2>
        </div>

        <div className="space-y-2 text-sm">
          {pageItemsNotes.map((log) => (
            <div key={log.id} className="border-l-2 border-blue-400 pl-2 py-1">
              <div className="whitespace-pre-wrap text-gray-800">{(log.note || '').replace(/[()]/g, '')}</div>
              <div className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString('id-ID')}</div>
            </div>
          ))}
        </div>

        <div className="mt-3">
          <Pagination current={currentPageNotes} total={totalPagesNotes} onChange={(p) => setNoteLogsPage(p)} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Log Aktivitas Pengaturan</h2>
        </div>
        <div className="space-y-2 text-sm">
          {pageItemsSettings.map((log) => (
            <div key={log.id} className="border-l-2 border-blue-400 pl-2 py-1">
              <div className="whitespace-pre-wrap text-gray-800">{String(log.content || '').replace(/[()]/g, '')}</div>
              <div className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString('id-ID')}</div>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <Pagination current={currentPageSettings} total={totalPagesSettings} onChange={(p) => setSettingsLogsPage(p)} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Log Aktivitas Produk</h2>
        </div>
        <div className="space-y-2 text-sm">
          {pageItemsProducts.map((log) => (
            <div key={log.id} className="border-l-2 border-blue-400 pl-2 py-1">
              <div className="whitespace-pre-wrap text-gray-800">{String(log.content || '').replace(/[()]/g, '')}</div>
              <div className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString('id-ID')}</div>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <Pagination current={currentPageProducts} total={totalPagesProducts} onChange={(p) => setProductLogsPage(p)} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">Log Aktivitas Keuangan</h2>
        </div>
        <div className="space-y-2 text-sm">
          {pageItemsFinance.map((log) => (
            <div key={log.id} className="border-l-2 border-blue-400 pl-2 py-1">
              <div className="whitespace-pre-wrap text-gray-800">{String(log.content || '').replace(/[()]/g, '')}</div>
              <div className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString('id-ID')}</div>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <Pagination current={currentPageFinance} total={totalPagesFinance} onChange={(p) => setFinanceLogsPage(p)} />
        </div>
      </div>

      {confirmClear && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <div className="font-bold text-lg mb-2">Konfirmasi Hapus</div>
            <div className="text-sm text-gray-700 mb-4">Buang semua log aktivitas stock?</div>
            <div className="flex gap-2 justify-end">
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmClear(false) }} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Batal</button>
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  try {
                    const res = await fetch('/api/stocks/logs', { method: 'DELETE', credentials: 'same-origin', headers: { 'Accept': 'application/json' } })
                    if (!res.ok) throw new Error('Gagal menghapus log')
                    setConfirmClear(false)
                    refresh()
                  } catch (err) {
                    alert('Terjadi error saat menghapus log: ' + err.message)
                  }
                }}
                className="px-4 py-2 rounded text-white bg-red-600"
              >Hapus</button>
            </div>
          </div>
        </div>
      )}

      {confirmClearNotes && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <div className="font-bold text-lg mb-2">Konfirmasi Hapus</div>
            <div className="text-sm text-gray-700 mb-4">Buang semua log aktivitas catatan?</div>
            <div className="flex gap-2 justify-end">
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmClearNotes(false) }} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Batal</button>
              <button
                onClick={async (e) => {
                  e.preventDefault(); e.stopPropagation();
                  try {
                    const res = await fetch('/api/notes/logs', { method: 'DELETE', credentials: 'same-origin', headers: { 'Accept': 'application/json' } })
                    if (!res.ok) throw new Error('Gagal menghapus log catatan')
                    setConfirmClearNotes(false)
                    refresh()
                  } catch (err) {
                    alert('Terjadi error saat menghapus log catatan: ' + err.message)
                  }
                }}
                className="px-4 py-2 rounded text-white bg-red-600"
              >Hapus</button>
            </div>
          </div>
        </div>
      )}
      {confirmClearSettings && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <div className="font-bold text-lg mb-2">Konfirmasi Hapus</div>
            <div className="text-sm text-gray-700 mb-4">Buang semua log aktivitas pengaturan?</div>
            <div className="flex gap-2 justify-end">
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmClearSettings(false) }} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Batal</button>
              <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); try { const res = await fetch('/api/settings/logs', { method: 'DELETE', credentials: 'same-origin', headers: { 'Accept': 'application/json' } }); if (!res.ok) throw new Error('Gagal menghapus log'); setConfirmClearSettings(false); refresh() } catch (err) { alert('Terjadi error saat menghapus log: ' + err.message) } }} className="px-4 py-2 rounded text-white bg-red-600">Hapus</button>
            </div>
          </div>
        </div>
      )}
      {confirmClearProducts && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <div className="font-bold text-lg mb-2">Konfirmasi Hapus</div>
            <div className="text-sm text-gray-700 mb-4">Buang semua log aktivitas produk?</div>
            <div className="flex gap-2 justify-end">
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmClearProducts(false) }} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Batal</button>
              <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); try { const res = await fetch('/api/products/logs', { method: 'DELETE', credentials: 'same-origin', headers: { 'Accept': 'application/json' } }); if (!res.ok) throw new Error('Gagal menghapus log produk'); setConfirmClearProducts(false); refresh() } catch (err) { alert('Terjadi error saat menghapus log produk: ' + err.message) } }} className="px-4 py-2 rounded text-white bg-red-600">Hapus</button>
            </div>
          </div>
        </div>
      )}
      {confirmClearFinance && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <div className="font-bold text-lg mb-2">Konfirmasi Hapus</div>
            <div className="text-sm text-gray-700 mb-4">Buang semua log aktivitas keuangan?</div>
            <div className="flex gap-2 justify-end">
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmClearFinance(false) }} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Batal</button>
              <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); try { const res = await fetch('/api/finance/logs', { method: 'DELETE', credentials: 'same-origin', headers: { 'Accept': 'application/json' } }); if (!res.ok) throw new Error('Gagal menghapus log keuangan'); setConfirmClearFinance(false); refresh() } catch (err) { alert('Terjadi error saat menghapus log keuangan: ' + err.message) } }} className="px-4 py-2 rounded text-white bg-red-600">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

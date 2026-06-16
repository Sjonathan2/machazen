export default function Pagination({ current, total, onChange }) {
  function build(totalPages, currentPage) {
    const items = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) items.push(i)
      return items
    }
    items.push(1)
    if (totalPages >= 2) items.push(2)
    if (currentPage <= 3) {
      items.push(3)
      items.push('...')
      items.push(totalPages - 1)
      items.push(totalPages)
    } else if (currentPage >= totalPages - 2) {
      items.push('...')
      items.push(totalPages - 2)
      items.push(totalPages - 1)
      items.push(totalPages)
    } else {
      items.push('...')
      items.push(currentPage - 1)
      items.push(currentPage)
      items.push(currentPage + 1)
      items.push('...')
      items.push(totalPages - 1)
      items.push(totalPages)
    }
    return items
  }

  const items = build(total, current)
  const canPrev = current > 1
  const canNext = current < total

  return (
    <div className="flex items-center gap-3 text-sm text-gray-700">
      <button
        onClick={() => canPrev && onChange(current - 1)}
        disabled={!canPrev}
        className={`px-2 py-1 rounded ${canPrev ? 'hover:bg-gray-200' : 'text-gray-400 cursor-not-allowed'}`}
      >
        ←
      </button>

      {items.map((it, idx) => (
        typeof it === 'number' ? (
          <button
            key={idx}
            onClick={() => onChange(it)}
            className={it === current ? 'px-2.5 py-1 rounded-lg bg-gray-800 text-white' : 'px-2 py-1 rounded hover:bg-gray-200'}
          >
            {it}
          </button>
        ) : (
          <span key={idx} className="px-2 text-gray-500">…</span>
        )
      ))}

      <button
        onClick={() => canNext && onChange(current + 1)}
        disabled={!canNext}
        className={`px-2 py-1 rounded ${canNext ? 'hover:bg-gray-200' : 'text-gray-400 cursor-not-allowed'}`}
      >
        →
      </button>
    </div>
  )
}


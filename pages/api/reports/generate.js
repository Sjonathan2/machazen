const prisma = require('../../../lib/prisma')
const { getAuthFromCookie } = require('../../../lib/auth')

function esc(s) {
  return String(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)')
}

function chunk(arr, size) {
  const res = []
  for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size))
  return res
}

function buildPdfReport(blocks) {
  const pageWidth = 842
  const pageHeight = 595
  const marginLeft = 40
  const marginRight = 40
  const marginTop = 36
  const marginBottom = 36
  const headerHeight = 56
  const objects = []
  const kids = []
  objects.push({ id: 1, str: '' })
  objects.push({ id: 2, str: '' })
  const fontRegularId = 3
  const fontBoldId = 4
  const fontRegularObj = { id: fontRegularId, str: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>' }
  const fontBoldObj = { id: fontBoldId, str: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>' }
  objects.push(fontRegularObj)
  objects.push(fontBoldObj)
  let y = pageHeight - marginTop - headerHeight
  let pageIndex = 0
  let contentStream = []
  const BRAND = { r: 46, g: 125, b: 50 }
  const BRAND_LIGHT = { r: 232, g: 245, b: 233 }
  function setFillRGB(r, g, b) {
    contentStream.push(`${(r/255).toFixed(3)} ${(g/255).toFixed(3)} ${(b/255).toFixed(3)} rg`)
  }
  function setStrokeRGB(r, g, b) {
    contentStream.push(`${(r/255).toFixed(3)} ${(g/255).toFixed(3)} ${(b/255).toFixed(3)} RG`)
  }
  function addRect(x, yRect, w, h, fill, stroke, lw = 1) {
    if (stroke) { contentStream.push(`${lw} w`) }
    contentStream.push(`${x} ${yRect} ${w} ${h} re${fill ? ' f' : ''}${stroke ? ' S' : ''}`)
  }
  function addPageHeader() {
    setFillRGB(BRAND.r, BRAND.g, BRAND.b)
    addRect(0, pageHeight - headerHeight, pageWidth, headerHeight, true, false)
    setFillRGB(255, 255, 255)
    contentStream.push('BT')
    contentStream.push(`/F2 18 Tf`)
    contentStream.push(`${marginLeft + 16} ${pageHeight - headerHeight + 20} Td`)
    contentStream.push(`(${esc('MACHAZEN.ID')}) Tj`)
    contentStream.push('ET')
    contentStream.push('BT')
    contentStream.push(`/F1 11 Tf`)
    contentStream.push(`${marginLeft + 16} ${pageHeight - headerHeight + 6} Td`)
    contentStream.push(`(${esc('Laporan Bisnis')}) Tj`)
    contentStream.push('ET')
    setFillRGB(0, 0, 0)
  }
  function addPageFooter(pageNum) {
    setStrokeRGB(BRAND.r, BRAND.g, BRAND.b)
    contentStream.push('0.5 w')
    contentStream.push(`${marginLeft} ${marginBottom - 10} m ${pageWidth - marginRight} ${marginBottom - 10} l S`)
    setFillRGB(0, 0, 0)
    contentStream.push('BT')
    contentStream.push(`/F1 9 Tf`)
    contentStream.push(`${pageWidth - marginRight - 60} ${marginBottom - 26} Td`)
    contentStream.push(`(${esc('Halaman ' + String(pageNum))}) Tj`)
    contentStream.push('ET')
  }
  function startPage() {
    contentStream = []
    addPageHeader()
    y = pageHeight - marginTop - headerHeight
  }
  startPage()
  function ensureSpace(h) {
    if (y - h < marginBottom) {
      addPageFooter(pageIndex + 1)
      const contentId = 5 + pageIndex * 2
      const pageId = contentId + 1
      const streamStr = contentStream.join('\n')
      objects.push({ id: contentId, str: `<< /Length ${Buffer.byteLength(streamStr)} >>\nstream\n${streamStr}\nendstream` })
      objects.push({ id: pageId, str: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>` })
      kids.push(`${pageId} 0 R`)
      pageIndex++
      startPage()
    }
  }
  function wrapText(text, size, maxWidth) {
    const approxCharW = size * 0.6
    const maxChars = Math.max(1, Math.floor(maxWidth / approxCharW))
    const words = String(text || '').split(/\s+/)
    const lines = []
    let line = ''
    for (const w of words) {
      if (line.length + w.length + 1 > maxChars) {
        if (line) lines.push(line)
        line = w
      } else {
        line = line ? `${line} ${w}` : w
      }
    }
    if (line) lines.push(line)
    return lines
  }
  function addText(text, size, bold, x, maxWidth) {
    const fontName = bold ? '/F2' : '/F1'
    const lh = size + 6
    const xx = (typeof x === 'number' ? x : marginLeft)
    if (maxWidth && maxWidth > 0) {
      const lines = wrapText(text, size, maxWidth)
      for (let i = 0; i < lines.length; i++) {
        ensureSpace(lh)
        contentStream.push('BT')
        contentStream.push(`${fontName} ${size} Tf`)
        contentStream.push(`${xx} ${y} Td`)
        contentStream.push(`(${esc(lines[i])}) Tj`)
        contentStream.push('ET')
        y -= lh
      }
    } else {
      ensureSpace(lh)
      contentStream.push('BT')
      contentStream.push(`${fontName} ${size} Tf`)
      contentStream.push(`${xx} ${y} Td`)
      contentStream.push(`(${esc(text)}) Tj`)
      contentStream.push('ET')
      y -= lh
    }
  }
  function addSpacer(h) {
    ensureSpace(h)
    y -= h
  }
  function addHr() {
    ensureSpace(8)
    setStrokeRGB(BRAND.r, BRAND.g, BRAND.b)
    contentStream.push('1 w')
    contentStream.push(`${marginLeft} ${y} m ${pageWidth - marginLeft} ${y} l S`)
    setStrokeRGB(0, 0, 0)
    y -= 8
  }
  function addTable(headers, rows, colWidths) {
    const sizeHeader = 11
    const sizeCell = 10
    const lhHeader = sizeHeader + 6
    const lhCell = sizeCell + 6
    const xs = []
    let acc = marginLeft
    for (let i = 0; i < colWidths.length; i++) {
      xs.push(acc)
      acc += colWidths[i]
    }
    ensureSpace(lhHeader + 10)
    setFillRGB(BRAND_LIGHT.r, BRAND_LIGHT.g, BRAND_LIGHT.b)
    addRect(xs[0] - 4, y - (lhHeader - 4), (acc - xs[0]) + 8, lhHeader, true, false)
    setFillRGB(0, 0, 0)
    ensureSpace(lhHeader)
    for (let i = 0; i < headers.length; i++) {
      contentStream.push('BT')
      contentStream.push(`/F2 ${sizeHeader} Tf`)
      contentStream.push(`${xs[i]} ${y} Td`)
      contentStream.push(`(${esc(String(headers[i]).slice(0, 40))}) Tj`)
      contentStream.push('ET')
    }
    y -= lhHeader
    addHr()
    for (let r = 0; r < rows.length; r++) {
      const wrappedCols = []
      let rowLines = 1
      for (let c = 0; c < headers.length; c++) {
        const maxChars = Math.max(1, Math.floor(colWidths[c] / (sizeCell * 0.6)))
        const lines = wrapText(String(rows[r][c] || ''), sizeCell, colWidths[c])
        wrappedCols.push(lines)
        rowLines = Math.max(rowLines, lines.length)
      }
      const rowHeight = lhCell * rowLines
      if (y - rowHeight < marginBottom) {
        ensureSpace(rowHeight)
        setFillRGB(BRAND_LIGHT.r, BRAND_LIGHT.g, BRAND_LIGHT.b)
        addRect(xs[0] - 4, y - (lhHeader - 4), (acc - xs[0]) + 8, lhHeader, true, false)
        setFillRGB(0, 0, 0)
        for (let i = 0; i < headers.length; i++) {
          contentStream.push('BT')
          contentStream.push(`/F2 ${sizeHeader} Tf`)
          contentStream.push(`${xs[i]} ${y} Td`)
          contentStream.push(`(${esc(String(headers[i]).slice(0, 40))}) Tj`)
          contentStream.push('ET')
        }
        y -= lhHeader
        addHr()
      }
      for (let lineIdx = 0; lineIdx < rowLines; lineIdx++) {
        ensureSpace(lhCell)
        for (let c = 0; c < headers.length; c++) {
          const txt = wrappedCols[c][lineIdx] || ''
          contentStream.push('BT')
          contentStream.push(`/F1 ${sizeCell} Tf`)
          contentStream.push(`${xs[c]} ${y} Td`)
          contentStream.push(`(${esc(txt)}) Tj`)
          contentStream.push('ET')
        }
        y -= lhCell
      }
      if (y - lhCell < marginBottom && r < rows.length - 1) {
        ensureSpace(lhCell)
      }
    }
    addSpacer(6)
  }
  function addChartBar({ title, labels, values, width = 720, height = 220 }) {
    ensureSpace(height + 40)
    const x0 = marginLeft
    const y0 = y
    const w = Math.min(width, pageWidth - marginRight - marginLeft)
    const h = height
    addText(title || 'Bar Chart', 12, true, x0, w)
    setStrokeRGB(0, 0, 0)
    contentStream.push('0.5 w')
    contentStream.push(`${x0} ${y0 - 18} m ${x0 + w} ${y0 - 18} l S`)
    const maxVal = Math.max(1, ...values.map(v => Number(v) || 0))
    const barCount = labels.length
    const barGap = 6
    const barW = Math.max(6, Math.floor((w - (barCount + 1) * barGap) / barCount))
    let cursorX = x0 + barGap
    const chartBottomY = y0 - h
    for (let i = 0; i < barCount; i++) {
      const v = Math.max(0, Number(values[i]) || 0)
      const bh = Math.floor((v / maxVal) * (h - 40))
      setFillRGB(46, 125, 50)
      addRect(cursorX, chartBottomY + 2, barW, bh, true, false)
      setFillRGB(0, 0, 0)
      contentStream.push('BT')
      contentStream.push(`/F1 9 Tf`)
      contentStream.push(`${cursorX} ${chartBottomY - 12} Td`)
      contentStream.push(`(${esc(String(labels[i]).slice(0, Math.max(4, Math.floor(barW / 6))))}) Tj`)
      contentStream.push('ET')
      cursorX += barW + barGap
    }
    y = chartBottomY - 28
    addSpacer(12)
  }
  function addChartLine({ title, labels, values, width = 720, height = 220 }) {
    ensureSpace(height + 40)
    const x0 = marginLeft
    const y0 = y
    const w = Math.min(width, pageWidth - marginRight - marginLeft)
    const h = height
    addText(title || 'Line Chart', 12, true, x0, w)
    setStrokeRGB(0, 0, 0)
    contentStream.push('0.5 w')
    contentStream.push(`${x0} ${y0 - 18} m ${x0 + w} ${y0 - 18} l S`)
    const maxVal = Math.max(1, ...values.map(v => Number(v) || 0))
    const leftPad = 40
    const bottomPad = 28
    const chartX = x0 + 0
    const chartY = y0 - h
    const chartW = w
    const chartH = h - bottomPad
    setStrokeRGB(200, 200, 200)
    contentStream.push('0.3 w')
    for (let i = 0; i <= 4; i++) {
      const yy = chartY + (i * chartH / 4)
      contentStream.push(`${chartX} ${yy} m ${chartX + chartW} ${yy} l S`)
    }
    setStrokeRGB(46, 125, 50)
    contentStream.push('1.2 w')
    const stepX = chartW / Math.max(1, (labels.length - 1))
    let prevX = chartX
    let prevY = chartY + (Number(values[0]) || 0) / maxVal * chartH
    for (let i = 1; i < labels.length; i++) {
      const xN = chartX + i * stepX
      const yN = chartY + (Number(values[i]) || 0) / maxVal * chartH
      contentStream.push(`${prevX} ${prevY} m ${xN} ${yN} l S`)
      prevX = xN
      prevY = yN
    }
    setFillRGB(0, 0, 0)
    const labelMaxChars = Math.max(4, Math.floor(stepX / 6))
    for (let i = 0; i < labels.length; i++) {
      const lx = chartX + i * stepX
      contentStream.push('BT')
      contentStream.push(`/F1 9 Tf`)
      contentStream.push(`${lx} ${chartY - 14} Td`)
      contentStream.push(`(${esc(String(labels[i]).slice(0, labelMaxChars))}) Tj`)
      contentStream.push('ET')
    }
    y = chartY - 20
    addSpacer(12)
  }
  function addChartPie({ title, slices, width = 720, height = 240 }) {
    ensureSpace(height + 40)
    const x0 = marginLeft
    const y0 = y
    const w = Math.min(width, pageWidth - marginRight - marginLeft)
    const h = height
    addText(title || 'Pie Chart', 12, true, x0, w)
    // Pie center and radius
    const cx = x0 + 120
    const cy = y0 - (h / 2)
    const r = Math.min(100, h / 2 - 20)
    const total = slices.reduce((a, s) => a + (Number(s.value) || 0), 0) || 1
    // Colors palette
    const COLORS = [
      [46, 125, 50], [197, 57, 41], [25, 118, 210], [245, 124, 0],
      [156, 39, 176], [0, 150, 136], [255, 87, 34], [0, 188, 212], [139, 195, 74], [255, 193, 7]
    ]
    let angle = 0
    function drawArcSlice(start, end, rgb) {
      const segs = Math.ceil((end - start) / (Math.PI / 2))
      const delta = (end - start) / segs
      let a = start
      setFillRGB(rgb[0], rgb[1], rgb[2])
      contentStream.push(`${cx} ${cy} m`)
      for (let i = 0; i < segs; i++) {
        const a1 = a
        const a2 = a + delta
        const k = 4 / 3 * Math.tan((a2 - a1) / 4)
        const x1 = cx + r * Math.cos(a1)
        const y1 = cy + r * Math.sin(a1)
        const x2 = cx + r * Math.cos(a2)
        const y2 = cy + r * Math.sin(a2)
        const cp1x = x1 - r * k * Math.sin(a1)
        const cp1y = y1 + r * k * Math.cos(a1)
        const cp2x = x2 + r * k * Math.sin(a2)
        const cp2y = y2 - r * k * Math.cos(a2)
        // Move to first point for first segment
        if (i === 0) {
          contentStream.push(`${x1} ${y1} l`)
        }
        contentStream.push(`${cp1x} ${cp1y} ${cp2x} ${cp2y} ${x2} ${y2} c`)
        a = a2
      }
      contentStream.push(`${cx} ${cy} l f`)
      setFillRGB(0, 0, 0)
    }
    for (let i = 0; i < slices.length; i++) {
      const frac = (Number(slices[i].value) || 0) / total
      const next = angle + frac * Math.PI * 2
      const color = COLORS[i % COLORS.length]
      drawArcSlice(angle, next, color)
      angle = next
    }
    // Legend
    const legendX = cx + r + 20
    const legendYStart = cy + r - 10
    let ly = legendYStart
    for (let i = 0; i < slices.length; i++) {
      const color = COLORS[i % COLORS.length]
      setFillRGB(color[0], color[1], color[2])
      addRect(legendX, ly, 12, 12, true, false)
      setFillRGB(0, 0, 0)
      const pct = Math.round(((Number(slices[i].value) || 0) / total) * 100)
      contentStream.push('BT')
      contentStream.push(`/F1 10 Tf`)
      contentStream.push(`${legendX + 16} ${ly + 2} Td`)
      contentStream.push(`(${esc(`${slices[i].label} — ${pct}%`)}) Tj`)
      contentStream.push('ET')
      ly -= 16
    }
    y = y0 - h - 8
    addSpacer(10)
  }
  for (const b of blocks) {
    if (b.type === 'h1') addText(b.text || '', 18, true, marginLeft, pageWidth - marginRight - marginLeft)
    else if (b.type === 'h2') { addText(b.text || '', 14, true, marginLeft, pageWidth - marginRight - marginLeft); addSpacer(2) }
    else if (b.type === 'text') addText(b.text || '', 11, false, typeof b.x === 'number' ? b.x : marginLeft, (typeof b.maxWidth === 'number' ? b.maxWidth : (pageWidth - marginRight - (typeof b.x === 'number' ? b.x : marginLeft))))
    else if (b.type === 'bullet') addText(`• ${b.text || ''}`, 11, false, marginLeft + 12, pageWidth - marginRight - (marginLeft + 12))
    else if (b.type === 'spacer') addSpacer(b.h || 8)
    else if (b.type === 'hr') addHr()
    else if (b.type === 'table') addTable(b.headers || [], b.rows || [], b.colWidths || [])
    else if (b.type === 'chartBar') addChartBar(b)
    else if (b.type === 'chartLine') addChartLine(b)
    else if (b.type === 'chartPie') addChartPie(b)
  }
  const contentId = 5 + pageIndex * 2
  const pageId = contentId + 1
  addPageFooter(pageIndex + 1)
  const streamStr = contentStream.join('\n')
  objects.push({ id: contentId, str: `<< /Length ${Buffer.byteLength(streamStr)} >>\nstream\n${streamStr}\nendstream` })
  objects.push({ id: pageId, str: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>` })
  kids.push(`${pageId} 0 R`)
  const pagesObj = { id: 2, str: `<< /Type /Pages /Count ${kids.length} /Kids [${kids.join(' ')}] >>` }
  const catalogObj = { id: 1, str: '<< /Type /Catalog /Pages 2 0 R >>' }
  objects[0] = catalogObj
  objects[1] = pagesObj
  let offset = 0
  let pdf = '%PDF-1.4\n'
  const xref = []
  for (const obj of objects) {
    xref.push(offset.toString().padStart(10, '0') + ' 00000 n ')
    const objStr = `${obj.id} 0 obj\n${obj.str}\nendobj\n`
    pdf += objStr
    offset = Buffer.byteLength(pdf)
  }
  const xrefStart = offset
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${xref.join('\n')}\n`
  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
  return Buffer.from(pdf, 'binary')
}

function usernameFromEmail(email) {
  const s = String(email || '')
  const at = s.indexOf('@')
  return at > 0 ? s.slice(0, at) : s
}

export default async function handler(req, res) {
  const auth = getAuthFromCookie(req)
  if (!auth) return res.status(401).json({ error: 'Unauthorized' })
  const email = auth.email
  if (email !== 'kent@machazen.id') return res.status(403).json({ error: 'Forbidden' })

  const user = await prisma.user.findUnique({ where: { email } })
  const stocks = await prisma.stock.findMany({ orderBy: { name: 'asc' } })
  const recipes = await prisma.recipe.findMany({ orderBy: { name: 'asc' } })
  const recipeIngs = await prisma.recipeIngredient.findMany()
  const sales = await prisma.salesOrder.findMany({ orderBy: { id: 'desc' } })
  const purchaseOrders = await prisma.purchaseOrder.findMany({ orderBy: { id: 'desc' } })
  const purchaseItemsByOrder = {}
  for (const po of purchaseOrders) {
    const items = await prisma.purchaseItem.findMany({ where: { orderId: po.id } })
    purchaseItemsByOrder[po.id] = items
  }
  const salesItems = await prisma.salesOrderItem.findMany({ orderBy: { id: 'desc' } })
  const settingsLogs = await prisma.note.findMany({ where: { title: 'SETTINGS_LOG' }, orderBy: { id: 'desc' }, take: 20 })
  const productLogs = await prisma.note.findMany({ where: { title: 'PRODUCT_LOG' }, orderBy: { id: 'desc' }, take: 20 })
  const financeLogs = await prisma.note.findMany({ where: { title: 'FINANCE_LOG' }, orderBy: { id: 'desc' }, take: 20 })
  const manualNotes = await prisma.note.findMany({ where: { authorId: user.id, title: 'FINANCE_TX' }, orderBy: { id: 'desc' }, take: 100 })
  const manualTransactions = []
  for (const n of manualNotes) {
    try {
      const data = JSON.parse(n.content || '{}')
      manualTransactions.push({
        type: data.type || 'expense',
        amount: Number(data.amount) || 0,
        date: new Date(data.date || n.createdAt),
        description: data.description || '',
        source: data.source || '',
        category: data.category || null,
        subCategory: data.subCategory || null,
        method: data.method || null
      })
    } catch {}
  }

  let revenue = 0
  for (const s of sales) revenue += Number(s.total) || 0
  let cogs = 0
  for (const po of purchaseOrders) {
    const sum = (purchaseItemsByOrder[po.id] || []).reduce((a, b) => a + (Number(b.totalPrice) || 0), 0)
    cogs += sum
  }
  const grossProfit = revenue - cogs
  let manualIncome = 0
  let manualExpense = 0
  for (const t of manualTransactions) {
    if ((t.type || '').toLowerCase() === 'income') manualIncome += Number(t.amount) || 0
    else manualExpense += Number(t.amount) || 0
  }

  const blocks = []
  blocks.push({ type: 'h1', text: 'LAPORAN BISNIS MACHAZEN.ID' })
  blocks.push({ type: 'text', text: `Tanggal: ${new Date().toLocaleString('id-ID')}` })
  blocks.push({ type: 'text', text: `Dibuat oleh: ${usernameFromEmail(user.email)} (${user.email})` })
  blocks.push({ type: 'spacer', h: 10 })
  blocks.push({ type: 'hr' })
  blocks.push({ type: 'h2', text: 'Ringkasan Bisnis' })
  blocks.push({ type: 'text', text: `Total Penjualan: Rp ${Math.round(revenue).toLocaleString('id-ID')}` })
  blocks.push({ type: 'text', text: `COGS: Rp ${Math.round(cogs).toLocaleString('id-ID')}` })
  blocks.push({ type: 'text', text: `Laba Kotor: Rp ${Math.round(grossProfit).toLocaleString('id-ID')}` })
  blocks.push({ type: 'text', text: `Pendapatan Manual: Rp ${Math.round(manualIncome).toLocaleString('id-ID')}` })
  blocks.push({ type: 'text', text: `Beban Manual: Rp ${Math.round(manualExpense).toLocaleString('id-ID')}` })
  blocks.push({ type: 'spacer', h: 8 })
  blocks.push({ type: 'hr' })
  // Visualisasi
  blocks.push({ type: 'h2', text: 'Visualisasi' })
  // Bar Chart: Top 10 menu paling banyak terjual (qty)
  const qtyByName = {}
  for (const it of salesItems) {
    const name = it.name || 'lainnya'
    qtyByName[name] = (qtyByName[name] || 0) + (Number(it.quantity) || 0)
  }
  const topMenus = Object.entries(qtyByName).sort((a,b)=>b[1]-a[1]).slice(0,10)
  const barLabels = topMenus.map(([n])=>n)
  const barValues = topMenus.map(([,v])=>v)
  blocks.push({ type:'chartBar', title:'Peringkat Menu Terjual (Top 10)', labels: barLabels, values: barValues, width: 720, height: 220 })
  // Line Chart: Qty terjual harian 7 hari terakhir
  const now = new Date()
  const dayLabels = []
  const dayValues = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const label = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`
    dayLabels.push(label)
    const qty = salesItems.filter(si=> {
      const od = sales.find(s=>s.id===si.orderId)
      const dt = od ? new Date(od.createdAt) : null
      if (!dt) return false
      return dt.getFullYear()===d.getFullYear() && dt.getMonth()===d.getMonth() && dt.getDate()===d.getDate()
    }).reduce((a,b)=>a+(Number(b.quantity)||0),0)
    dayValues.push(qty)
  }
  blocks.push({ type:'chartLine', title:'Qty Terjual Harian (7 Hari)', labels: dayLabels, values: dayValues, width: 720, height: 220 })
  // Pie Chart: Komposisi Laba Rugi (Pendapatan vs HPP vs Beban Operasional)
  const pieSlices = [
    { label: 'Pendapatan', value: Math.max(0, revenue) },
    { label: 'HPP', value: Math.max(0, cogs) },
    { label: 'Beban Operasional', value: Math.max(0, manualExpense) }
  ]
  blocks.push({ type:'chartPie', title:'Komposisi Laba/Rugi', slices: pieSlices, width: 720, height: 240 })
  blocks.push({ type: 'spacer', h: 8 })
  blocks.push({ type: 'hr' })
  blocks.push({ type: 'h2', text: 'Stok' })
  const stockRows = []
  for (const s of stocks) stockRows.push([s.name, `${s.quantity}`, `${s.unit||'-'}`, `${s.minLevel}`])
  blocks.push({ type: 'table', headers: ['Nama', 'Qty', 'Unit', 'Min'], rows: stockRows, colWidths: [260, 70, 80, 60] })
  blocks.push({ type: 'h2', text: 'Produk' })
  const stockMap = {}
  for (const s of stocks) stockMap[s.id] = s.name
  for (const r of recipes) {
    blocks.push({ type: 'text', text: `${r.name} • Rp ${Math.round(Number(r.price)||0).toLocaleString('id-ID')}` })
    const ings = recipeIngs.filter(i => i.recipeId === r.id)
    for (const ing of ings) blocks.push({ type: 'bullet', text: `${ing.quantity} ${ing.unit||''} ${stockMap[ing.stockId] || ing.stockId}` })
    blocks.push({ type: 'spacer', h: 6 })
  }
  blocks.push({ type: 'h2', text: 'Penjualan' })
  const salesRows = []
  for (const s of sales) salesRows.push([`#${s.id}`, `${s.customerName||'-'}`, `Rp ${Math.round(Number(s.total)||0).toLocaleString('id-ID')}`, `${s.paid?'Lunas':'Belum Lunas'}`, `${new Date(s.createdAt).toLocaleString('id-ID')}`])
  blocks.push({ type: 'table', headers: ['ID', 'Customer', 'Total', 'Status', 'Tanggal'], rows: salesRows, colWidths: [60, 160, 120, 80, 120] })
  blocks.push({ type: 'h2', text: 'Pembelian' })
  const poRows = []
  for (const po of purchaseOrders) {
    const sum = (purchaseItemsByOrder[po.id] || []).reduce((a, b) => a + (Number(b.totalPrice) || 0), 0)
    poRows.push([`#${po.id}`, `${po.place||'-'}`, `Rp ${Math.round(sum).toLocaleString('id-ID')}`, `${new Date(po.createdAt).toLocaleString('id-ID')}`])
  }
  blocks.push({ type: 'table', headers: ['ID', 'Tempat', 'Total', 'Tanggal'], rows: poRows, colWidths: [60, 160, 140, 160] })
  blocks.push({ type: 'h2', text: 'Transaksi Manual' })
  const manualRows = []
  for (const tx of manualTransactions) manualRows.push([`${tx.date.toLocaleString('id-ID')}`, `${(tx.type||'').toUpperCase()}`, `Rp ${Math.round(tx.amount).toLocaleString('id-ID')}`, `${tx.source || '-'}`, `${tx.description || '-'}`])
  blocks.push({ type: 'table', headers: ['Tanggal', 'Jenis', 'Nominal', 'Sumber', 'Keterangan'], rows: manualRows, colWidths: [140, 80, 120, 100, 140] })
  blocks.push({ type: 'h2', text: 'Logs Pengaturan' })
  for (const log of settingsLogs) blocks.push({ type: 'bullet', text: `${new Date(log.createdAt).toLocaleString('id-ID')}: ${log.content}` })
  blocks.push({ type: 'h2', text: 'Logs Produk' })
  for (const log of productLogs) blocks.push({ type: 'bullet', text: `${new Date(log.createdAt).toLocaleString('id-ID')}: ${log.content}` })
  blocks.push({ type: 'h2', text: 'Logs Keuangan' })
  for (const log of financeLogs) blocks.push({ type: 'bullet', text: `${new Date(log.createdAt).toLocaleString('id-ID')}: ${log.content}` })

  const pdfBuf = buildPdfReport(blocks)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', 'attachment; filename="Laporan_Machazen.pdf"')
  res.send(pdfBuf)
}

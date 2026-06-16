// Nilai default untuk minimum stock
const DEFAULT_MIN_VALUES = {
  kg: 5,
  g: 500,
  L: 2,
  ml: 250,
  pcs: 10
}

// Karena localStorage tidak tersedia di server-side,
// kita akan menggunakan in-memory storage untuk demo
let minValuesStorage = { ...DEFAULT_MIN_VALUES }

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Untuk demo, kita return nilai dari storage
      // Di produksi, ini akan mengambil dari database
      res.status(200).json(minValuesStorage)
    } catch (error) {
      console.error('Error getting min values:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else if (req.method === 'POST') {
    try {
      const values = req.body
      
      // Validasi input
      const validUnits = ['kg', 'g', 'L', 'ml', 'pcs']
      const validatedValues = {}
      
      validUnits.forEach(unit => {
        if (values[unit] !== undefined && values[unit] !== '') {
          validatedValues[unit] = parseFloat(values[unit])
        }
      })
      
      // Update storage
      minValuesStorage = { ...minValuesStorage, ...validatedValues }
      
      res.status(200).json({ message: 'Settings saved successfully', values: minValuesStorage })
    } catch (error) {
      console.error('Error saving min values:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
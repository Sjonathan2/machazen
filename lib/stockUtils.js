// Nilai minimum default
export function getDefaultMinValues() {
  return {
    kg: 5,
    g: 500,
    L: 2,
    ml: 250,
    pcs: 10
  }
}

// Fungsi untuk menentukan status stock berdasarkan qty dan unit
export function getStockStatus(qty, unit, minValues) {
  // Unit Kilogram dan Liter tidak memiliki nilai minimum, langsung tersedia
  if (unit === 'Kilogram' || unit === 'Liter') {
    if (qty <= 0) return 'Habis'
    return 'Tersedia'
  }
  // Mapping unit yang digunakan di aplikasi ke key di minValues
  const unitMapping = {
    'Kilogram': 'kg',
    'Gram': 'g',
    'Liter': 'L',
    'Mililiter': 'ml',
    'Pieces': 'pcs'
  }
  
  const minValueKey = unitMapping[unit]
  if (!minValueKey || !minValues[minValueKey]) {
    return 'Tersedia' // Default jika unit tidak dikenali
  }
  
  const minValue = minValues[minValueKey]
  
  if (qty <= 0) {
    return 'Habis'
  } else if (qty < minValue) {
    return 'Hampir Habis'
  } else {
    return 'Tersedia'
  }
}

// Fungsi untuk mendapatkan warna status
export function getStockStatusColor(status) {
  switch (status) {
    case 'Tersedia':
      return 'text-green-600'
    case 'Hampir Habis':
      return 'text-yellow-600'
    case 'Habis':
      return 'text-red-600'
    default:
      return 'text-gray-600'
  }
}

// Fungsi untuk mendapatkan icon status
export function getStockStatusIcon(status) {
  switch (status) {
    case 'Tersedia':
      return '✓'
    case 'Hampir Habis':
      return '⚠️'
    case 'Habis':
      return '✗'
    default:
      return '?'
  }
}

// Fungsi untuk menghitung selisih kekurangan stok
export function getStockShortage(qty, unit, minValues) {
  // Unit Kilogram dan Liter tidak memiliki nilai minimum, tidak ada kekurangan
  if (unit === 'Kilogram' || unit === 'Liter') {
    return 0
  }
  // Mapping unit yang digunakan di aplikasi ke key di minValues
  const unitMapping = {
    'Kilogram': 'kg',
    'Gram': 'g',
    'Liter': 'L',
    'Mililiter': 'ml',
    'Pieces': 'pcs'
  }
  
  const minValueKey = unitMapping[unit]
  if (!minValueKey || !minValues[minValueKey]) {
    return 0 // Tidak ada kekurangan jika unit tidak dikenali
  }
  
  const minValue = minValues[minValueKey]
  
  if (qty < minValue) {
    return minValue - qty // Hitung kekurangan
  }
  
  return 0 // Tidak ada kekurangan jika stok cukup
}
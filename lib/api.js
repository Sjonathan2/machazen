export function handleError(err, defaultMsg = 'Terjadi kesalahan') {
  console.error(err)
  return err?.response?.data?.error || err?.message || defaultMsg
}

export async function fetchAPI(url, options = {}) {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    })
    const data = await res.json()
    if (!res.ok) {
      throw { response: { data } }
    }
    return data
  } catch (err) {
    throw err
  }
}

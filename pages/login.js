import { useState } from 'react'
import { useRouter } from 'next/router'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const router = useRouter()

  async function submit(e) {
    e.preventDefault()
    setError(null)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (res.ok) {
      router.push('/dashboard')
    } else {
      setError(data.error || 'Login gagal')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-background">
      <form onSubmit={submit} className="bg-white p-10 rounded-lg shadow-lg w-96">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold" style={{ color: '#2e7d32' }}>MACHAZEN.ID</h1>
          <div className="flex justify-center my-4">
            <img src="/images/machazen-logo.png" alt="Machazen Logo" className="h-32 w-32 object-contain" />
          </div>
        </div>
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
        <label className="block mb-2 font-semibold">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 px-4 py-2 rounded mb-4 focus:outline-none focus:border-green-500" placeholder="Email" />
        <label className="block mb-2 font-semibold">Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-gray-300 px-4 py-2 rounded mb-6 focus:outline-none focus:border-green-500" placeholder="Password" />
        <button className="w-full text-white py-2 rounded font-semibold transition" style={{ background: '#2e7d32' }} onMouseEnter={(e) => e.target.style.background = '#1b5e20'} onMouseLeave={(e) => e.target.style.background = '#2e7d32'}>Masuk</button>

      </form>
      <style jsx>{`
        .gradient-background {
          background: linear-gradient(152deg,#fafbfa,#ffffff,#8ff98f,#03f903);
          background-size: 240% 240%;
          animation: gradient-animation 8s ease infinite;
        }
        @keyframes gradient-animation {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export function withAuth(Component) {
  return function ProtectedComponent(props) {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState(null)

    useEffect(() => {
      async function checkAuth() {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        } else {
          router.replace('/login')
        }
        setLoading(false)
      }
      checkAuth()
    }, [])

    if (loading) {
      return <div className="min-h-screen flex items-center justify-center">Loading...</div>
    }

    return <Component user={user} {...props} />
  }
}

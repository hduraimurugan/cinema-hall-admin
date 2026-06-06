import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'

export const GitHubCallback = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { githubLogin } = useAuth()
  const [error, setError] = useState(null)

  useEffect(() => {
    const code = searchParams.get('code')
    const errorParam = searchParams.get('error')

    if (errorParam) {
      setError('GitHub login was cancelled or denied.')
      toast.error('GitHub login was cancelled.')
      setTimeout(() => navigate('/login'), 2000)
      return
    }

    if (!code) {
      setError('No authorization code received from GitHub.')
      setTimeout(() => navigate('/login'), 2000)
      return
    }

    const handleCallback = async () => {
      try {
        const result = await githubLogin(code)
        if (result.success) {
          toast.success('Welcome!')
          navigate('/')
        } else {
          setError(result.message || 'GitHub login failed')
          toast.error(result.message || 'GitHub login failed')
          setTimeout(() => navigate('/login'), 3000)
        }
      } catch (err) {
        setError('GitHub login failed. Please try again.')
        toast.error('GitHub login failed. Please try again.')
        setTimeout(() => navigate('/login'), 3000)
      }
    }

    handleCallback()
  }, [searchParams, githubLogin, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        {error ? (
          <div className="space-y-2">
            <p className="text-destructive font-medium">{error}</p>
            <p className="text-muted-foreground text-sm">Redirecting to login...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Completing GitHub login...</p>
          </div>
        )}
      </div>
    </div>
  )
}

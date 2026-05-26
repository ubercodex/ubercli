import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const hasAttempted = useRef(false);

  useEffect(() => {
    // Prevent double execution in React strict mode
    if (hasAttempted.current) return;
    hasAttempted.current = true;

    const code = searchParams.get('code');
    
    if (!code) {
      setError('No authorization code received');
      return;
    }

    login(code)
      .then(() => {
        navigate('/publish');
      })
      .catch((err) => {
        setError(err.message || 'Authentication failed');
      });
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        {error ? (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-white mb-2">Authentication Failed</h1>
            <p className="text-slate-400 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-cyan-500 to-violet-600 text-white"
            >
              Go Home
            </button>
          </>
        ) : (
          <>
            <div className="inline-block w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
            <h1 className="text-2xl font-bold text-white mb-2">Authenticating...</h1>
            <p className="text-slate-400">Please wait while we sign you in</p>
          </>
        )}
      </div>
    </div>
  );
}

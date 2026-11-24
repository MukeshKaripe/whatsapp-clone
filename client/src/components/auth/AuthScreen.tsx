import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, LogIn, UserPlus, UserCheck, AlertCircle } from 'lucide-react';

export const AuthScreen = () => {
  const { login, register, isLoading } = useAuth();
  const [isLoginView, setIsLoginView] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [about, setAbout] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Demo accounts seeded in the database
  const demoUsers = [
    { name: 'Anil Kumar', email: 'anil@example.com', role: 'Full Stack' },
    { name: 'Sarah Jenkins', email: 'sarah@example.com', role: 'UI/UX Lead' },
    { name: 'David Chen', email: 'david@example.com', role: 'Backend' },
    { name: 'Emma Watson', email: 'emma@example.com', role: 'Product' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (isLoginView) {
        await login(email, password);
      } else {
        await register({ name, email, password, about });
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.details?.[0] || 'Authentication failed. Please check your credentials.';
      setError(msg);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setError(null);
    try {
      await login(demoEmail, 'password123');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Demo login failed. Make sure server is running.';
      setError(msg);
    }
  };

  return (
    <div className="relative flex min-h-screen w-screen flex-col items-center justify-center bg-wa-bg p-4 text-wa-primary select-none transition-colors duration-150">
      {/* Top Green Accent Header Band (authentic WhatsApp Web style) */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-wa-green/90 dark:bg-wa-panel" />

      {/* Main Auth Container Card */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-wa-border bg-wa-surface shadow-2xl transition-all">
        {/* Brand Header */}
        <div className="flex flex-col items-center border-b border-wa-border bg-wa-panel p-6 text-center">
          <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-wa-green text-white shadow-md">
            <svg
              className="h-8 w-8 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.63C8.75 21.41 10.37 21.82 12.04 21.82C17.5 21.82 21.95 17.37 21.95 11.91C21.95 6.45 17.5 2 12.04 2M12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.8 7.37 7.5 3.67 12.04 3.67C16.58 3.67 20.28 7.37 20.28 11.91C20.28 16.45 16.58 20.15 12.04 20.15M16.57 14.53C16.32 14.4 15.1 13.8 14.87 13.72C14.64 13.64 14.48 13.6 14.31 13.85C14.15 14.1 13.67 14.67 13.52 14.84C13.38 15 13.23 15.02 12.98 14.9C12.73 14.77 11.93 14.51 10.99 13.67C10.25 13.01 9.75 12.19 9.61 11.94C9.46 11.69 9.59 11.56 9.72 11.43C9.83 11.32 9.97 11.14 10.1 10.99C10.22 10.84 10.26 10.74 10.34 10.57C10.42 10.41 10.38 10.26 10.32 10.14C10.26 10.01 9.77 8.81 9.56 8.32C9.37 7.84 9.17 7.91 9.02 7.9C8.88 7.89 8.71 7.89 8.55 7.89C8.38 7.89 8.12 7.95 7.89 8.2C7.66 8.45 7.02 9.05 7.02 10.28C7.02 11.5 7.91 12.69 8.04 12.86C8.16 13.02 9.79 15.54 12.28 16.61C12.87 16.87 13.33 17.02 13.69 17.14C14.29 17.33 14.83 17.3 15.26 17.24C15.74 17.17 16.74 16.63 16.95 16.05C17.15 15.46 17.15 14.97 17.09 14.86C17.03 14.76 16.87 14.67 16.57 14.53Z" />
            </svg>
          </div>
          <h1 className="text-xl font-medium tracking-tight text-wa-primary">
            WhatsApp Web
          </h1>
          <p className="mt-1 text-xs text-wa-secondary">
            {isLoginView ? 'Sign in to start messaging' : 'Create an account to get started'}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-500">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {!isLoginView && (
              <div>
                <label className="block text-xs font-medium text-wa-secondary mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full rounded-lg bg-wa-input px-3.5 py-2.5 text-sm text-wa-primary placeholder-wa-secondary border border-wa-border focus:border-wa-green focus:outline-none transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-wa-secondary mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-lg bg-wa-input px-3.5 py-2.5 text-sm text-wa-primary placeholder-wa-secondary border border-wa-border focus:border-wa-green focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-wa-secondary mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg bg-wa-input px-3.5 py-2.5 text-sm text-wa-primary placeholder-wa-secondary border border-wa-border focus:border-wa-green focus:outline-none transition-colors"
              />
            </div>

            {!isLoginView && (
              <div>
                <label className="block text-xs font-medium text-wa-secondary mb-1">
                  About / Status (Optional)
                </label>
                <input
                  type="text"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="Hey there! I am using WhatsApp."
                  className="w-full rounded-lg bg-wa-input px-3.5 py-2.5 text-sm text-wa-primary placeholder-wa-secondary border border-wa-border focus:border-wa-green focus:outline-none transition-colors"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-wa-green font-medium text-white shadow transition-all hover:bg-wa-green/90 active:scale-[0.99] disabled:opacity-50"
            >
              {isLoginView ? (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>{isLoading ? 'Creating account...' : 'Create Account'}</span>
                </>
              )}
            </button>
          </form>

          {/* Toggle View Link */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLoginView((prev) => !prev);
                setError(null);
              }}
              className="text-xs text-wa-green hover:underline focus:outline-none"
            >
              {isLoginView
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>

          {/* 1-Click Quick Demo Login Section */}
          <div className="mt-6 border-t border-wa-border pt-4">
            <div className="mb-2.5 flex items-center justify-between text-xs text-wa-secondary">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                1-Click Demo Accounts
              </span>
              <span className="flex items-center gap-1 text-[10px]">
                <UserCheck className="h-3 w-3 text-wa-green" />
                <span>Password: password123</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {demoUsers.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleDemoLogin(u.email)}
                  className="flex flex-col items-start rounded-lg border border-wa-border bg-wa-panel/80 p-2 text-left transition-all hover:border-wa-green hover:bg-wa-hover active:scale-95 disabled:opacity-50"
                >
                  <span className="truncate text-xs font-medium text-wa-primary">
                    {u.name}
                  </span>
                  <span className="text-[10px] text-wa-secondary">
                    {u.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer encrypted disclaimer */}
        <div className="flex items-center justify-center gap-1.5 border-t border-wa-border bg-wa-panel py-3 text-[11px] text-wa-secondary">
          <Lock className="h-3 w-3" />
          <span>End-to-end encrypted session</span>
        </div>
      </div>
    </div>
  );
};

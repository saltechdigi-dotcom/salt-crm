import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader } from '@/components/ui/loader';
import { useAuthStore } from '@/stores/auth-store';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import saltLogo from '@/assets/salt-logo.png';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading: authLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setFormError('Preencha e-mail e senha para continuar.');
      return;
    }

    setFormError(null);
    setIsLoading(true);

    try {
      const { redirectTo } = await login(email, password);
      navigate(redirectTo);
    } catch (error: any) {
      setFormError(error.message || 'Credenciais inválidas. Verifique seu e-mail e senha.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 relative">
      <div className="w-full max-w-sm animate-fade-in flex flex-col">
        {/* Logo with orbital animation */}
        <div className="text-center mb-6">
          <div className="relative inline-flex items-center justify-center">
            {/* Outer ring pulse - more subtle */}
            <div className="absolute w-24 h-24 rounded-full border border-primary/10 animate-ping" style={{ animationDuration: '4s' }} />
            <div className="absolute w-20 h-20 rounded-full border border-primary/15 animate-pulse" />

            {/* Glowing backdrop - reduced */}
            <div className="absolute w-16 h-16 bg-primary/10 rounded-full blur-xl animate-pulse" />

            {/* Main logo */}
            <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden">
              <img
                src={saltLogo}
                alt="SALT Logo"
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>

            {/* Orbiting dots - more subtle */}
            <div
              className="absolute w-2 h-2 bg-sky-400/70 rounded-full shadow-md shadow-sky-400/30"
              style={{ animation: 'orbit 4s linear infinite' }}
            />
            <div
              className="absolute w-1.5 h-1.5 bg-blue-400/60 rounded-full shadow-md shadow-blue-400/25"
              style={{ animation: 'orbit 6s linear infinite reverse', animationDelay: '-1s' }}
            />
            <div
              className="absolute w-1 h-1 bg-indigo-400/50 rounded-full shadow-sm shadow-indigo-400/20"
              style={{ animation: 'orbit 8s linear infinite', animationDelay: '-3s' }}
            />
          </div>

          <h1 className="text-2xl font-bold text-foreground mt-7 tracking-tight">
            SALT AI & Automation
          </h1>
          <p className="text-muted-foreground/70 text-sm mt-1.5">
            Acesse sua plataforma
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {formError && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg px-3 py-2">
              {formError}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="ios-label text-xs font-medium text-muted-foreground">
              E-mail
            </Label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="ios-input pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="ios-label text-xs font-medium text-muted-foreground">
              Senha
            </Label>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="ios-input pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <Button
              type="submit"
              variant="ios-filled"
              size="default"
              className="w-4/5 transition-all duration-300 hover:scale-[1.01] hover:shadow-md active:scale-[0.99] bg-primary/90 hover:bg-primary/85"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader size="sm" variant="spinner" />
              ) : (
                <>
                  Acessar Plataforma
                  <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Footer Links */}
        <div className="text-center mt-5">
          <button className="text-sm text-primary hover:text-primary/80 transition-colors duration-200 hover:underline underline-offset-4">
            Esqueceu sua senha?
          </button>
        </div>
      </div>

      {/* Footer fixo no bottom */}
      <p className="absolute bottom-6 left-0 right-0 text-center text-xs text-muted-foreground/70" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        SALT AI & Automation
      </p>
    </div>
  );
};

export default Login;

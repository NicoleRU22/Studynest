import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookOpen, Mail, Lock, Sparkles, GraduationCap } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const Login = () => {
  const { signIn, resetPassword, user, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showReset, setShowReset] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600 dark:text-purple-400" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    await signIn(email, password);
    setIsLoading(false);
  };

  const handleResetPassword = async () => {
    if (!email) {
      setErrors({ email: 'Ingresa tu correo para restablecer la contraseña' });
      return;
    }
    setIsLoading(true);
    await resetPassword(email);
    setIsLoading(false);
    setShowReset(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-800 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 dark:bg-blue-800 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-300 dark:bg-indigo-800 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Decorative shapes */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200/30 dark:bg-purple-800/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-200/30 dark:bg-blue-800/20 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and title section */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 shadow-2xl shadow-purple-500/50 mb-6 transform hover:scale-110 transition-transform duration-300">
            <BookOpen className="h-10 w-10 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <GraduationCap className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 dark:from-purple-400 dark:via-indigo-400 dark:to-blue-400 bg-clip-text text-transparent">
              StudyNest
            </h1>
            <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
          </div>
          <p className="text-muted-foreground mt-2 text-base font-medium">
            Tu nido de productividad académica
          </p>
        </div>

        {/* Login Card */}
        <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-2 border-purple-200/50 dark:border-purple-800/50 shadow-2xl shadow-purple-500/10 dark:shadow-purple-900/20">
          <CardHeader className="space-y-3 pb-4">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Iniciar sesión
            </CardTitle>
            <CardDescription className="text-base">
              Ingresa tus credenciales para acceder a tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                  Correo electrónico
                </Label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-500 dark:text-purple-400 z-10" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-12 border-2 border-purple-200/50 dark:border-purple-800/50 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm transition-all duration-300 relative z-0"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500 dark:text-red-400 font-medium animate-fade-in">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                  Contraseña
                </Label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-500 dark:text-purple-400 z-10" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-12 border-2 border-purple-200/50 dark:border-purple-800/50 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm transition-all duration-300 relative z-0"
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500 dark:text-red-400 font-medium animate-fade-in">
                    {errors.password}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white font-semibold text-base shadow-lg shadow-purple-500/50 dark:shadow-purple-900/50 hover:shadow-xl hover:shadow-purple-600/50 dark:hover:shadow-purple-800/50 transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Iniciar sesión
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setShowReset(!showReset)}
                className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline transition-colors duration-200"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {showReset && (
              <div className="mt-4 p-5 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200/50 dark:border-purple-800/50 animate-fade-in backdrop-blur-sm">
                <p className="text-sm text-muted-foreground mb-4 font-medium">
                  Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
                </p>
                <Button
                  onClick={handleResetPassword}
                  variant="secondary"
                  className="w-full h-11 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 hover:from-purple-500/20 hover:to-indigo-500/20 border border-purple-300/50 dark:border-purple-700/50 text-purple-700 dark:text-purple-300 font-semibold transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar enlace de recuperación'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center pt-6 border-t border-purple-200/50 dark:border-purple-800/50">
            <p className="text-sm text-muted-foreground">
              ¿No tienes cuenta?{' '}
              <Link
                to="/register"
                className="font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline transition-colors duration-200"
              >
                Regístrate ahora
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Login;

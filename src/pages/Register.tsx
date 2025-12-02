import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, BookOpen, Mail, Lock, User, GraduationCap, Sparkles, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';

const universities = [
  'Universidad Nacional Autónoma de México (UNAM)',
  'Instituto Tecnológico de Monterrey (ITESM)',
  'Instituto Politécnico Nacional (IPN)',
  'Universidad Autónoma de México (UAM)',
  'Universidad de Buenos Aires (UBA)',
  'Pontificia Universidad Católica de Chile',
  'Universidad de los Andes',
  'Universidad de São Paulo (USP)',
  'Otra',
];

const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  email: z.string().email('Correo inválido').max(255),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  university: z.string().min(1, 'Selecciona una universidad'),
});

const Register = () => {
  const { signUp, user, isLoading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [university, setUniversity] = useState('');
  const [customUniversity, setCustomUniversity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900/20 dark:to-purple-900/20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const finalUniversity = university === 'Otra' ? customUniversity : university;

    const result = registerSchema.safeParse({
      name,
      email,
      password,
      university: finalUniversity,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    await signUp(email, password, name, finalUniversity);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900/20 dark:to-purple-900/20">
      {/* Background elements - positioned asymmetrically for organic feel */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-96 h-96 bg-indigo-200/40 dark:bg-indigo-900/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-32 left-8 w-80 h-80 bg-purple-200/40 dark:bg-purple-900/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-pink-200/30 dark:bg-pink-900/15 rounded-full blur-2xl"></div>
      </div>

      {/* Floating decorative elements */}
      <div className="absolute top-16 left-12 opacity-20 dark:opacity-10">
        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
      </div>
      <div className="absolute bottom-24 right-16 opacity-20 dark:opacity-10">
        <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse delay-300"></div>
      </div>
      <div className="absolute top-1/2 right-20 opacity-15 dark:opacity-8">
        <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse delay-700"></div>
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Header section - slightly offset for organic feel */}
        <div className="text-center mb-10 transform translate-x-1">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-xl shadow-indigo-500/30 dark:shadow-indigo-900/50 mb-5 transform hover:rotate-3 transition-transform duration-300">
            <BookOpen className="h-10 w-10 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-3">
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              StudyNest
            </h1>
            <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
          </div>
          <p className="text-muted-foreground text-base font-medium">
            Únete a nuestra comunidad académica
          </p>
        </div>

        {/* Registration Card */}
        <Card className="backdrop-blur-xl bg-white/85 dark:bg-gray-900/85 border-2 border-indigo-200/60 dark:border-indigo-800/40 shadow-2xl shadow-indigo-500/10 dark:shadow-indigo-900/20">
          <CardHeader className="space-y-2 pb-5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                Crear cuenta
              </CardTitle>
            </div>
            <CardDescription className="text-base pt-1">
              Completa el formulario para comenzar tu viaje académico
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2.5">
                <Label htmlFor="name" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Nombre completo
                </Label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Ej: María González"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 border-2 border-indigo-200/50 dark:border-indigo-800/50 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm transition-all duration-300 relative z-0"
                  />
                </div>
                {errors.name && (
                  <p className="text-sm text-red-500 dark:text-red-400 font-medium animate-fade-in flex items-center gap-1">
                    <span>•</span> {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="email" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  Correo electrónico
                </Label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 border-2 border-indigo-200/50 dark:border-indigo-800/50 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm transition-all duration-300 relative z-0"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500 dark:text-red-400 font-medium animate-fade-in flex items-center gap-1">
                    <span>•</span> {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="password" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" />
                  Contraseña
                </Label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 border-2 border-indigo-200/50 dark:border-indigo-800/50 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm transition-all duration-300 relative z-0"
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500 dark:text-red-400 font-medium animate-fade-in flex items-center gap-1">
                    <span>•</span> {errors.password}
                  </p>
                )}
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="university" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Universidad
                </Label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Select value={university} onValueChange={setUniversity}>
                    <SelectTrigger className="h-12 border-2 border-indigo-200/50 dark:border-indigo-800/50 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm transition-all duration-300 relative z-0 pl-10">
                      <GraduationCap className="absolute left-3 h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                      <SelectValue placeholder="Selecciona tu universidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {universities.map((uni) => (
                        <SelectItem key={uni} value={uni}>
                          {uni}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {errors.university && (
                  <p className="text-sm text-red-500 dark:text-red-400 font-medium animate-fade-in flex items-center gap-1">
                    <span>•</span> {errors.university}
                  </p>
                )}
              </div>

              {university === 'Otra' && (
                <div className="space-y-2.5 animate-fade-in">
                  <Label htmlFor="customUniversity" className="text-sm font-semibold text-foreground">
                    Nombre de tu universidad
                  </Label>
                  <Input
                    id="customUniversity"
                    type="text"
                    placeholder="Escribe el nombre completo de tu universidad"
                    value={customUniversity}
                    onChange={(e) => setCustomUniversity(e.target.value)}
                    className="h-12 border-2 border-indigo-200/50 dark:border-indigo-800/50 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm transition-all duration-300"
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold text-base shadow-lg shadow-indigo-500/40 dark:shadow-indigo-900/40 hover:shadow-xl hover:shadow-indigo-600/50 dark:hover:shadow-indigo-800/50 transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creando tu cuenta...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Crear cuenta
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center pt-6 border-t border-indigo-200/50 dark:border-indigo-800/50">
            <p className="text-sm text-muted-foreground">
              ¿Ya tienes una cuenta?{' '}
              <Link
                to="/login"
                className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline transition-colors duration-200"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>

      <style>{`
        .delay-300 {
          animation-delay: 300ms;
        }
        .delay-700 {
          animation-delay: 700ms;
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
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

export default Register;

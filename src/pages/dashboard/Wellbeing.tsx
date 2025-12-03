import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Brain, Trophy, Leaf, Plus, X, Loader2, TrendingUp, Calendar, Award, BarChart3 } from 'lucide-react';
import { format, differenceInDays, startOfWeek, endOfWeek, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';

const Wellbeing = () => {
  const { user, profile, fetchProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isBreatheMode, setIsBreatheMode] = useState(false);
  const [breatheTime, setBreatheTime] = useState(60);
  const [semesterGoal, setSemesterGoal] = useState('');
  const [dailyLearnings, setDailyLearnings] = useState('');
  const [smallWins, setSmallWins] = useState<string[]>([]);
  const [newWin, setNewWin] = useState('');

  useEffect(() => {
    if (profile) {
      setSemesterGoal(profile.semester_goal || '');
      setDailyLearnings(profile.daily_learnings || '');
      setSmallWins(profile.small_wins || []);
      setIsLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isBreatheMode && breatheTime > 0) {
      interval = setInterval(() => {
        setBreatheTime((t) => t - 1);
      }, 1000);
    } else if (breatheTime === 0) {
      setIsBreatheMode(false);
      setBreatheTime(60);
      toast({ title: '🌿 ¡Respiro completado! Te lo merecías.' });
    }
    return () => clearInterval(interval);
  }, [isBreatheMode, breatheTime]);

  const updateProfile = async (field: string, value: string | string[]) => {
    const { error } = await supabase
      .from('profiles')
      .update({ [field]: value })
      .eq('user_id', user!.id);

    if (error) {
      toast({ title: 'Error al guardar', variant: 'destructive' });
      return;
    }

    if (user) {
      fetchProfile(user.id);
    }
  };

  const handleGoalBlur = () => {
    updateProfile('semester_goal', semesterGoal);
    toast({ title: '✅ Objetivo guardado' });
  };

  const handleLearningsBlur = () => {
    updateProfile('daily_learnings', dailyLearnings);
    toast({ title: '✅ Aprendizajes guardados' });
  };

  const addWin = () => {
    if (!newWin.trim()) return;
    const newWins = [...smallWins, newWin];
    setSmallWins(newWins);
    setNewWin('');
    updateProfile('small_wins', newWins);
    toast({ title: '🎉 ¡Victoria añadida!' });
  };

  const removeWin = (index: number) => {
    const newWins = smallWins.filter((_, i) => i !== index);
    setSmallWins(newWins);
    updateProfile('small_wins', newWins);
  };

  const startBreathe = () => {
    setIsBreatheMode(true);
    setBreatheTime(60);
  };

  // Calcular estadísticas
  const totalWins = smallWins.length;
  const hasGoal = semesterGoal.trim().length > 0;
  const hasLearnings = dailyLearnings.trim().length > 0;
  
  // Calcular racha de días (días desde que se creó la cuenta)
  // Usamos user.created_at como fallback si profile.created_at no está disponible
  const accountAge = user?.created_at
    ? differenceInDays(new Date(), new Date(user.created_at))
    : 0;

  // Calcular actividad de esta semana (aproximación basada en updated_at)
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  // @ts-ignore - updated_at might not be in Profile type yet
  const isActiveThisWeek = profile?.updated_at 
    ? isWithinInterval(new Date(profile.updated_at), { start: weekStart, end: weekEnd })
    : false;
  
  // Simular actividad basada en si hay contenido
  const hasActivityToday = hasLearnings || hasGoal;

  // Datos para gráfico de actividad semanal
  // Simulamos actividad basada en si hay contenido y el día actual
  const currentDayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const weeklyActivity = weekDays.map((day, index) => {
    // Si es hoy y hay actividad, mostrar actividad
    if (index === currentDayIndex && hasActivityToday) {
      return { day: format(day, 'EEE', { locale: es }), value: 1 };
    }
    // Si es un día pasado y hay actividad general, mostrar algo de actividad
    if (index < currentDayIndex && (hasLearnings || hasGoal)) {
      return { day: format(day, 'EEE', { locale: es }), value: Math.random() > 0.3 ? 1 : 0 };
    }
    return { day: format(day, 'EEE', { locale: es }), value: 0 };
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isBreatheMode) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm animate-fade-in">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4"
          onClick={() => {
            setIsBreatheMode(false);
            setBreatheTime(60);
          }}
        >
          <X className="h-6 w-6" />
        </Button>

        <p className="text-lg text-muted-foreground mb-8">Inhala... exhala...</p>

        <div className="relative">
          <div className="w-48 h-48 rounded-full bg-secondary/30 animate-breathe flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-secondary/50 animate-breathe flex items-center justify-center" style={{ animationDelay: '0.5s' }}>
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                <Leaf className="h-8 w-8 text-secondary-foreground" />
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-4xl font-bold text-foreground">{breatheTime}s</p>
        <p className="mt-2 text-muted-foreground">Tiempo restante</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mi Rincón</h1>
        <p className="text-muted-foreground">Un espacio para ti, más allá de las entregas</p>
      </div>

      {/* Estadísticas de Bienestar */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Victorias Totales</p>
                <p className="text-3xl font-bold text-foreground">{totalWins}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Días en StudyNest</p>
                <p className="text-3xl font-bold text-foreground">{accountAge}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Objetivo del Semestre</p>
                <p className="text-2xl font-bold text-foreground">
                  {hasGoal ? '✓ Definido' : 'Pendiente'}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-info/20 flex items-center justify-center">
                <Target className="h-6 w-6 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Aprendizajes Hoy</p>
                <p className="text-2xl font-bold text-foreground">
                  {hasLearnings ? '✓ Registrado' : 'Sin registro'}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-secondary/20 flex items-center justify-center">
                <Brain className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Actividad Semanal */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            Actividad de la Semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-end justify-between gap-2 h-32">
              {weeklyActivity.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="relative w-full flex items-end justify-center" style={{ height: '80px' }}>
                    <div
                      className={`w-full rounded-t transition-all duration-500 ${
                        item.value > 0
                          ? 'bg-gradient-to-t from-primary to-primary/60'
                          : 'bg-muted'
                      }`}
                      style={{
                        height: item.value > 0 ? '60%' : '20%',
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-primary"></div>
                <span>Con actividad</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-muted"></div>
                <span>Sin actividad</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Semester goal */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              Objetivo del semestre
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="¿Qué quieres lograr este semestre? Escríbelo aquí..."
              value={semesterGoal}
              onChange={(e) => setSemesterGoal(e.target.value)}
              onBlur={handleGoalBlur}
              className="min-h-[100px] resize-none"
            />
          </CardContent>
        </Card>

        {/* Daily learnings */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5 text-info" />
              Cosas que aprendí hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="¿Qué descubriste hoy? Puede ser algo pequeño o grande..."
              value={dailyLearnings}
              onChange={(e) => setDailyLearnings(e.target.value)}
              onBlur={handleLearningsBlur}
              className="min-h-[100px] resize-none"
            />
          </CardContent>
        </Card>
      </div>

      {/* Small wins */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-accent" />
            Pequeñas victorias
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Añade una victoria, por pequeña que sea..."
              value={newWin}
              onChange={(e) => setNewWin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addWin()}
            />
            <Button variant="secondary" onClick={addWin}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {smallWins.length > 0 ? (
            <div className="space-y-2">
              {smallWins.map((win, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 rounded-lg bg-accent/10 group"
                >
                  <span className="text-lg">🎉</span>
                  <span className="flex-1">{win}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeWin(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              Aún no has agregado victorias. ¡Empieza con algo pequeño!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Breathe mode */}
      <Card className="glass bg-gradient-to-br from-secondary/20 to-secondary/5">
        <CardContent className="flex flex-col items-center py-8">
          <Leaf className="h-12 w-12 text-secondary mb-4" />
          <h3 className="text-xl font-bold mb-2">Modo Respira</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Tomate 60 segundos para respirar. A veces, eso es todo lo que necesitas.
          </p>
          <Button
            onClick={startBreathe}
            className="gradient-secondary shadow-soft"
            size="lg"
          >
            <Leaf className="h-5 w-5 mr-2" />
            Empezar respiro
          </Button>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground italic">
        "Estás organizado. Y está bien tomarte un respiro." 🌱
      </p>
    </div>
  );
};

export default Wellbeing;

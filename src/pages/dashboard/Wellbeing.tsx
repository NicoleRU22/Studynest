import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Brain, Trophy, Leaf, Plus, X, Loader2 } from 'lucide-react';

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

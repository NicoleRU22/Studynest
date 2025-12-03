import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  Pencil,
  Loader2,
  TrendingUp,
  Award,
  BarChart3,
  Calculator,
  BookOpen,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface Grade {
  id: string;
  subject_id: string | null;
  name: string;
  grade: number;
  max_grade: number;
  weight: number;
  evaluation_type: string;
  date: string;
  notes: string | null;
  created_at: string;
}

interface Subject {
  id: string;
  name: string;
  color: string;
}

const evaluationTypes = {
  exam: { label: 'Examen', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
  homework: { label: 'Tarea', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
  project: { label: 'Proyecto', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
  participation: { label: 'Participación', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
  quiz: { label: 'Quiz', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' },
  other: { label: 'Otro', color: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300' },
};

const Grades = () => {
  const { user } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [formData, setFormData] = useState({
    subject_id: '',
    name: '',
    grade: '',
    max_grade: '20',
    weight: '1',
    evaluation_type: 'exam',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Cargar materias primero (más importante)
      const subjectsRes = await supabase
        .from('subjects')
        .select('id, name, color')
        .order('name');

      if (subjectsRes.error) {
        console.error('Error fetching subjects:', subjectsRes.error);
        toast({ 
          title: 'Error al cargar materias', 
          description: subjectsRes.error.message,
          variant: 'destructive' 
        });
      } else {
        setSubjects(subjectsRes.data || []);
      }

      // Intentar cargar calificaciones (puede fallar si la tabla no existe aún)
      const gradesRes = await supabase
        .from('grades')
        .select('*')
        .order('date', { ascending: false });

      if (gradesRes.error) {
        console.error('Error fetching grades:', gradesRes.error);
        // Si el error es que la tabla no existe, solo mostrar warning, no error crítico
        if (gradesRes.error.message.includes('does not exist') || gradesRes.error.message.includes('schema cache')) {
          console.warn('Tabla grades no existe aún. Ejecuta la migración SQL.');
          setGrades([]);
        } else {
          toast({ 
            title: 'Error al cargar calificaciones', 
            description: gradesRes.error.message,
            variant: 'destructive' 
          });
        }
      } else {
        setGrades(gradesRes.data || []);
      }

      setIsLoading(false);
    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast({ 
        title: 'Error inesperado', 
        description: error.message || 'Por favor recarga la página',
        variant: 'destructive' 
      });
      setIsLoading(false);
    }
  };

  const filteredGrades = selectedSubject === 'all'
    ? grades
    : grades.filter((g) => g.subject_id === selectedSubject);
  
  // Filtrar calificaciones sin materia si es necesario
  const validGrades = filteredGrades.filter((g) => g.subject_id !== null);

  const getSubjectName = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId)?.name || 'Materia desconocida';
  };

  const getSubjectColor = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId)?.color || '#3B82F6';
  };

  // Calcular promedio ponderado por materia
  const calculateSubjectAverage = (subjectId: string) => {
    const subjectGrades = grades.filter((g) => g.subject_id === subjectId && g.subject_id !== null);
    if (subjectGrades.length === 0) return null;

    let totalWeighted = 0;
    let totalWeight = 0;

    subjectGrades.forEach((grade) => {
      const percentage = (grade.grade / grade.max_grade) * 100;
      const weighted = (percentage * grade.weight) / 100;
      totalWeighted += weighted;
      totalWeight += grade.weight;
    });

    if (totalWeight === 0) return null;
    return (totalWeighted / totalWeight) * 20; // Convertir a escala de 0-20
  };

  // Calcular GPA general (promedio de todas las materias)
  const calculateGPA = () => {
    const subjectAverages: Record<string, number> = {};
    
    grades.forEach((grade) => {
      if (!subjectAverages[grade.subject_id]) {
        const avg = calculateSubjectAverage(grade.subject_id);
        if (avg !== null) {
          subjectAverages[grade.subject_id] = avg;
        }
      }
    });

    const averages = Object.values(subjectAverages);
    if (averages.length === 0) return null;

    const sum = averages.reduce((acc, val) => acc + val, 0);
    return sum / averages.length;
  };

  // Predicción de calificación final (asumiendo que faltan evaluaciones)
  const predictFinalGrade = (subjectId: string) => {
    const subjectGrades = grades.filter((g) => g.subject_id === subjectId && g.subject_id !== null);
    if (subjectGrades.length === 0) return null;

    const currentWeight = subjectGrades.reduce((sum, g) => sum + g.weight, 0);
    const remainingWeight = 100 - currentWeight;

    if (remainingWeight <= 0) {
      // Ya se completó todo, retornar el promedio actual
      return calculateSubjectAverage(subjectId);
    }

    const currentAverage = calculateSubjectAverage(subjectId);
    if (currentAverage === null) return null;

    // Predicción: asumir que las evaluaciones restantes tendrán el mismo rendimiento
    const predicted = (currentAverage * currentWeight + currentAverage * remainingWeight) / 100;
    return predicted;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject_id) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar una materia',
        variant: 'destructive',
      });
      return;
    }

    const gradeValue = parseFloat(formData.grade);
    const maxGradeValue = parseFloat(formData.max_grade);
    const weightValue = parseFloat(formData.weight);

    if (isNaN(gradeValue) || isNaN(maxGradeValue) || isNaN(weightValue)) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa valores numéricos válidos',
        variant: 'destructive',
      });
      return;
    }

    if (gradeValue < 0 || gradeValue > maxGradeValue) {
      toast({
        title: 'Error',
        description: 'La calificación debe estar entre 0 y la nota máxima',
        variant: 'destructive',
      });
      return;
    }

    // Validar que la calificación no exceda 20 (según el CHECK constraint)
    if (gradeValue > 20) {
      toast({
        title: 'Error',
        description: 'La calificación no puede ser mayor a 20',
        variant: 'destructive',
      });
      return;
    }

    if (weightValue < 0 || weightValue > 100) {
      toast({
        title: 'Error',
        description: 'El peso debe estar entre 0 y 100',
        variant: 'destructive',
      });
      return;
    }

    const payload = {
      subject_id: formData.subject_id || null,
      name: formData.name,
      grade: gradeValue,
      max_grade: maxGradeValue,
      weight: weightValue,
      evaluation_type: formData.evaluation_type,
      date: formData.date,
      notes: formData.notes || null,
      user_id: user!.id,
    };

    if (editingGrade) {
      const { error } = await supabase
        .from('grades')
        .update(payload)
        .eq('id', editingGrade.id);

      if (error) {
        console.error('Error updating grade:', error);
        toast({ 
          title: 'Error al actualizar', 
          description: error.message,
          variant: 'destructive' 
        });
        return;
      }
      toast({ title: '✅ Calificación actualizada' });
    } else {
      const { error } = await supabase.from('grades').insert(payload);

      if (error) {
        console.error('Error creating grade:', error);
        console.error('Payload:', payload);
        toast({ 
          title: 'Error al crear calificación', 
          description: error.message || 'Verifica que la tabla grades exista y tenga las políticas RLS configuradas',
          variant: 'destructive' 
        });
        return;
      }
      toast({ title: '✅ Calificación registrada' });
    }

    resetForm();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('grades').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error al eliminar', variant: 'destructive' });
      return;
    }
    toast({ title: '✅ Calificación eliminada' });
    fetchData();
  };

  const openEdit = (grade: Grade) => {
    setEditingGrade(grade);
    setFormData({
      subject_id: grade.subject_id,
      name: grade.name,
      grade: grade.grade.toString(),
      max_grade: grade.max_grade.toString(),
      weight: grade.weight.toString(),
      evaluation_type: grade.evaluation_type,
      date: grade.date,
      notes: grade.notes || '',
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      subject_id: '',
      name: '',
      grade: '',
      max_grade: '20',
      weight: '1',
      evaluation_type: 'exam',
      date: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
    });
    setEditingGrade(null);
    setIsDialogOpen(false);
  };

  // Preparar datos para gráfico
  const chartData = subjects.map((subject) => {
    const avg = calculateSubjectAverage(subject.id);
    return {
      name: subject.name.length > 10 ? subject.name.substring(0, 10) + '...' : subject.name,
      promedio: avg !== null ? parseFloat(avg.toFixed(2)) : 0,
      color: subject.color,
    };
  }).filter((item) => item.promedio > 0);

  const gpa = calculateGPA();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calificaciones</h1>
          <p className="text-muted-foreground">Registra y monitorea tu rendimiento académico</p>
        </div>
        <Button
          className="gradient-primary shadow-soft"
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva calificación
        </Button>
      </div>

      {/* Estadísticas generales */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">GPA General</p>
                <p className="text-3xl font-bold text-foreground">
                  {gpa !== null ? gpa.toFixed(2) : 'N/A'}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Award className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Calificaciones</p>
                <p className="text-3xl font-bold text-foreground">{grades.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Materias Activas</p>
                <p className="text-3xl font-bold text-foreground">
                  {new Set(grades.map((g) => g.subject_id)).size}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-info/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de promedios por materia */}
      {chartData.length > 0 && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              Promedios por Materia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                promedio: {
                  label: 'Promedio',
                  color: 'hsl(var(--primary))',
                },
              }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 20]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="promedio" fill="var(--color-promedio)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Filtro por materia */}
      <div className="flex items-center gap-4">
        <Label>Filtrar por materia:</Label>
        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las materias</SelectItem>
            {subjects.map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  />
                  {subject.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de calificaciones por materia */}
      {subjects
        .filter((subject) => selectedSubject === 'all' || subject.id === selectedSubject)
        .map((subject) => {
          const subjectGrades = grades.filter((g) => g.subject_id === subject.id);
          if (subjectGrades.length === 0 && selectedSubject !== 'all') return null;

          const average = calculateSubjectAverage(subject.id);
          const predicted = predictFinalGrade(subject.id);

          return (
            <Card key={subject.id} className="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: subject.color }}
                    />
                    {subject.name}
                  </CardTitle>
                  <div className="flex items-center gap-4">
                    {average !== null && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Promedio Actual</p>
                        <p className="text-xl font-bold text-foreground">
                          {average.toFixed(2)}
                        </p>
                      </div>
                    )}
                    {predicted !== null && average !== null && predicted !== average && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Predicción Final</p>
                        <p className="text-lg font-semibold text-muted-foreground">
                          {predicted.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {subjectGrades.length > 0 ? (
                  <div className="space-y-3">
                    {subjectGrades.map((grade) => {
                      const percentage = (grade.grade / grade.max_grade) * 100;
                      const typeConfig = evaluationTypes[grade.evaluation_type as keyof typeof evaluationTypes] || evaluationTypes.other;

                      return (
                        <div
                          key={grade.id}
                          className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border group hover:shadow-soft transition-all"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold">{grade.name}</h4>
                              <span
                                className={`text-xs px-2 py-1 rounded ${typeConfig.color}`}
                              >
                                {typeConfig.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>
                                <strong className="text-foreground">
                                  {grade.grade.toFixed(2)}
                                </strong>
                                /{grade.max_grade}
                              </span>
                              <span>
                                Peso: <strong className="text-foreground">{grade.weight}%</strong>
                              </span>
                              <span>
                                {format(new Date(grade.date), 'dd MMM yyyy', { locale: es })}
                              </span>
                              <span className="text-primary font-medium">
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                            {grade.notes && (
                              <p className="text-xs text-muted-foreground mt-2">{grade.notes}</p>
                            )}
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => openEdit(grade)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDelete(grade.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No hay calificaciones registradas para esta materia
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}

      {/* Dialog para crear/editar calificación */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingGrade ? 'Editar calificación' : 'Nueva calificación'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="subject_id">Materia *</Label>
                <Select
                  value={formData.subject_id}
                  onValueChange={(v) => setFormData({ ...formData, subject_id: v })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una materia" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: s.color }}
                          />
                          {s.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="evaluation_type">Tipo de evaluación *</Label>
                <Select
                  value={formData.evaluation_type}
                  onValueChange={(v) => setFormData({ ...formData, evaluation_type: v })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(evaluationTypes).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la evaluación *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Parcial 1, Tarea 3, Proyecto Final"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="grade">Calificación *</Label>
                <Input
                  id="grade"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_grade">Nota máxima *</Label>
                <Input
                  id="max_grade"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.max_grade}
                  onChange={(e) => setFormData({ ...formData, max_grade: e.target.value })}
                  placeholder="20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Peso (%) *</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder="1.0"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Fecha *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observaciones adicionales..."
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit" className="gradient-primary">
                {editingGrade ? 'Guardar cambios' : 'Registrar calificación'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Grades;


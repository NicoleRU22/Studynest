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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Plus, AlertTriangle, Pencil, Trash2, BookOpen, Loader2 } from 'lucide-react';
import { format, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';

interface Subject {
  id: string;
  name: string;
  color: string;
  professor: string | null;
  schedule: string | null;
  deadline_convenio: string | null;
  notes: string | null;
}

interface Task {
  id: string;
  title: string;
  completed_at: string | null;
  due_date: string | null;
}

const colorOptions = [
  '#3B82F6', '#10B981', '#F97316', '#8B5CF6', '#EC4899',
  '#06B6D4', '#EAB308', '#EF4444', '#14B8A6', '#6366F1',
];

const Subjects = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<Record<string, Task[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    professor: '',
    schedule: '',
    deadline_convenio: '',
    notes: '',
  });

  useEffect(() => {
    if (user) {
      fetchSubjects();
    }
  }, [user]);

  const fetchSubjects = async () => {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error al cargar materias', variant: 'destructive' });
      return;
    }

    setSubjects(data || []);
    
    // Fetch tasks for each subject
    const tasksMap: Record<string, Task[]> = {};
    for (const subject of data || []) {
      const { data: taskData } = await supabase
        .from('tasks')
        .select('id, title, completed_at, due_date')
        .eq('subject_id', subject.id);
      tasksMap[subject.id] = taskData || [];
    }
    setTasks(tasksMap);
    setIsLoading(false);
  };

  const calculateProgress = (subjectId: string) => {
    const subjectTasks = tasks[subjectId] || [];
    if (subjectTasks.length === 0) return 0;
    const completed = subjectTasks.filter(t => t.completed_at).length;
    return Math.round((completed / subjectTasks.length) * 100);
  };

  const getNextDeadline = (subjectId: string) => {
    const subjectTasks = tasks[subjectId] || [];
    const upcoming = subjectTasks
      .filter(t => t.due_date && !t.completed_at)
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());
    return upcoming[0]?.due_date;
  };

  const isDeadlineNear = (deadline: string | null) => {
    if (!deadline) return false;
    const hours = differenceInHours(new Date(deadline), new Date());
    return hours <= 48 && hours >= 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      color: formData.color,
      professor: formData.professor || null,
      schedule: formData.schedule || null,
      deadline_convenio: formData.deadline_convenio || null,
      notes: formData.notes || null,
      user_id: user!.id,
    };

    if (editingSubject) {
      const { error } = await supabase
        .from('subjects')
        .update(payload)
        .eq('id', editingSubject.id);

      if (error) {
        toast({ title: 'Error al actualizar', variant: 'destructive' });
        return;
      }
      toast({ title: '✅ Materia actualizada' });
    } else {
      const { error } = await supabase.from('subjects').insert(payload);

      if (error) {
        toast({ title: 'Error al crear materia', variant: 'destructive' });
        return;
      }
      toast({ title: '✅ Materia creada' });
    }

    resetForm();
    fetchSubjects();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error al eliminar', variant: 'destructive' });
      return;
    }
    toast({ title: '✅ Materia eliminada' });
    fetchSubjects();
    setSelectedSubject(null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      color: '#3B82F6',
      professor: '',
      schedule: '',
      deadline_convenio: '',
      notes: '',
    });
    setEditingSubject(null);
    setIsDialogOpen(false);
  };

  const openEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      color: subject.color,
      professor: subject.professor || '',
      schedule: subject.schedule || '',
      deadline_convenio: subject.deadline_convenio ? subject.deadline_convenio.split('T')[0] : '',
      notes: subject.notes || '',
    });
    setIsDialogOpen(true);
  };

  const updateNotes = async (notes: string) => {
    if (!selectedSubject) return;
    await supabase
      .from('subjects')
      .update({ notes })
      .eq('id', selectedSubject.id);
  };

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
          <h1 className="text-2xl font-bold text-foreground">Mis Materias</h1>
          <p className="text-muted-foreground">Organiza tus cursos y entregas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary shadow-soft" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva materia
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSubject ? 'Editar materia' : 'Nueva materia'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la materia</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full transition-transform ${
                        formData.color === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="professor">Profesor (opcional)</Label>
                <Input
                  id="professor"
                  value={formData.professor}
                  onChange={(e) => setFormData({ ...formData, professor: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule">Horario (opcional)</Label>
                <Input
                  id="schedule"
                  value={formData.schedule}
                  onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                  placeholder="Ej: Lun/Mie 10:00-12:00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline_convenio">Cierre de convenio (opcional)</Label>
                <Input
                  id="deadline_convenio"
                  type="date"
                  value={formData.deadline_convenio}
                  onChange={(e) => setFormData({ ...formData, deadline_convenio: e.target.value })}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit" className="gradient-primary">
                  {editingSubject ? 'Guardar cambios' : 'Crear materia'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {subjects.length === 0 ? (
        <Card className="glass">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground">No tienes materias aún</h3>
            <p className="text-muted-foreground text-center mt-2">
              Crea tu primera materia para empezar a organizar tus cursos
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => {
            const progress = calculateProgress(subject.id);
            const nextDeadline = getNextDeadline(subject.id);
            const isNear = isDeadlineNear(nextDeadline);

            return (
              <Card
                key={subject.id}
                className="glass hover:shadow-soft transition-all duration-300 cursor-pointer group"
                onClick={() => setSelectedSubject(subject)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: subject.color }}
                      />
                      <CardTitle className="text-lg">{subject.name}</CardTitle>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={(e) => { e.stopPropagation(); openEdit(subject); }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={(e) => { e.stopPropagation(); handleDelete(subject.id); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {subject.professor && (
                    <p className="text-sm text-muted-foreground">Prof. {subject.professor}</p>
                  )}
                  
                  {nextDeadline && (
                    <div className={`flex items-center gap-2 text-sm ${isNear ? 'text-accent' : 'text-muted-foreground'}`}>
                      {isNear && <AlertTriangle className="h-4 w-4" />}
                      <span>
                        Próxima entrega: {format(new Date(nextDeadline), 'dd MMM', { locale: es })}
                      </span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progreso</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: subject.color,
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Subject details sheet */}
      <Sheet open={!!selectedSubject} onOpenChange={() => setSelectedSubject(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          {selectedSubject && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: selectedSubject.color }}
                  />
                  {selectedSubject.name}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {selectedSubject.professor && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Profesor</p>
                    <p>{selectedSubject.professor}</p>
                  </div>
                )}
                {selectedSubject.schedule && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Horario</p>
                    <p>{selectedSubject.schedule}</p>
                  </div>
                )}
                {selectedSubject.deadline_convenio && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Cierre de convenio</p>
                    <p>{format(new Date(selectedSubject.deadline_convenio), 'dd MMMM yyyy', { locale: es })}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Notas rápidas</Label>
                  <Textarea
                    placeholder="Escribe notas sobre esta materia..."
                    defaultValue={selectedSubject.notes || ''}
                    className="min-h-[100px]"
                    onBlur={(e) => updateNotes(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Tareas vinculadas</Label>
                    <span className="text-sm text-muted-foreground">
                      {tasks[selectedSubject.id]?.length || 0} tareas
                    </span>
                  </div>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {(tasks[selectedSubject.id] || []).map((task) => (
                      <div
                        key={task.id}
                        className={`flex items-center gap-2 p-2 rounded-lg bg-muted ${
                          task.completed_at ? 'opacity-60' : ''
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            task.completed_at
                              ? 'bg-secondary border-secondary text-secondary-foreground'
                              : 'border-muted-foreground'
                          }`}
                        >
                          {task.completed_at && <span className="text-xs">✓</span>}
                        </div>
                        <span className={task.completed_at ? 'line-through' : ''}>
                          {task.title}
                        </span>
                      </div>
                    ))}
                    {(tasks[selectedSubject.id] || []).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay tareas vinculadas
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Subjects;

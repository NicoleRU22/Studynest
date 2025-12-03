import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
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
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  Pin,
  Calendar,
  RefreshCw,
  Users,
  Trash2,
  Pencil,
  GripVertical,
  CheckSquare,
  Loader2,
} from 'lucide-react';
import { format, isToday, isThisWeek, addDays, addWeeks } from 'date-fns';
import { es } from 'date-fns/locale';

interface Task {
  id: string;
  title: string;
  type: string;
  due_date: string | null;
  is_recurring: boolean | null;
  recurring_frequency: string | null;
  completed_at: string | null;
  position: number | null;
}

type FilterType = 'all' | 'today' | 'week' | 'no-date' | 'team';

const typeConfig = {
  simple: { icon: Pin, color: 'text-blue-600 dark:text-blue-400', label: 'Pendiente' },
  deadline: { icon: Calendar, color: 'text-orange-600 dark:text-orange-400', label: 'Con fecha' },
  recurring: { icon: RefreshCw, color: 'text-green-600 dark:text-green-400', label: 'Recurrente' },
  team: { icon: Users, color: 'text-purple-600 dark:text-purple-400', label: 'Para equipo' },
};

const SortableTask = ({
  task,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const config = typeConfig[task.type];
  const Icon = config.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-lg bg-card border border-border group transition-all hover:shadow-soft ${
        task.completed_at ? 'opacity-60' : ''
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      <button
        onClick={() => onToggle(task)}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
          task.completed_at
            ? 'bg-secondary border-secondary text-secondary-foreground'
            : 'border-muted-foreground hover:border-primary'
        }`}
      >
        {task.completed_at && <span className="text-xs">✓</span>}
      </button>

      <Icon className={`h-5 w-5 ${config.color} flex-shrink-0`} />

      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${task.completed_at ? 'line-through' : ''}`}>
          {task.title}
        </p>
        {task.due_date && (
          <p className="text-xs text-muted-foreground">
            {format(new Date(task.due_date), 'dd MMM yyyy', { locale: es })}
          </p>
        )}
      </div>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => onEdit(task)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-destructive"
          onClick={() => onDelete(task.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    type: 'simple' as Task['type'],
    due_date: '',
    recurring_frequency: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('position', { ascending: true });

    if (error) {
      toast({ title: 'Error al cargar tareas', variant: 'destructive' });
      return;
    }

    setTasks(data || []);
    setIsLoading(false);
  };

  const filteredTasks = tasks.filter((task) => {
    switch (filter) {
      case 'today':
        return task.due_date && isToday(new Date(task.due_date));
      case 'week':
        return task.due_date && isThisWeek(new Date(task.due_date));
      case 'no-date':
        return !task.due_date;
      case 'team':
        return task.type === 'team';
      default:
        return true;
    }
  });

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const { error } = await supabase.from('tasks').insert({
      title: newTaskTitle,
      type: 'simple',
      user_id: user!.id,
      position: tasks.length,
    });

    if (error) {
      toast({ title: 'Error al crear tarea', variant: 'destructive' });
      return;
    }

    toast({ title: '✅ Tarea creada' });
    setNewTaskTitle('');
    fetchTasks();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      title: formData.title,
      type: formData.type,
      due_date: formData.due_date || null,
      is_recurring: formData.type === 'recurring',
      recurring_frequency: formData.type === 'recurring' ? formData.recurring_frequency : null,
      user_id: user!.id,
      position: editingTask?.position ?? tasks.length,
    };

    if (editingTask) {
      const { error } = await supabase
        .from('tasks')
        .update(payload)
        .eq('id', editingTask.id);

      if (error) {
        toast({ title: 'Error al actualizar', variant: 'destructive' });
        return;
      }
      toast({ title: '✅ Tarea actualizada' });
    } else {
      const { error } = await supabase.from('tasks').insert(payload);

      if (error) {
        toast({ title: 'Error al crear tarea', variant: 'destructive' });
        return;
      }
      toast({ title: '✅ Tarea creada' });
    }

    resetForm();
    fetchTasks();
  };

  const handleToggle = async (task: Task) => {
    if (task.completed_at) {
      // Uncheck
      const { error } = await supabase
        .from('tasks')
        .update({ completed_at: null })
        .eq('id', task.id);

      if (error) {
        toast({ title: 'Error', variant: 'destructive' });
        return;
      }
    } else {
      // Check
      const { error } = await supabase
        .from('tasks')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', task.id);

      if (error) {
        toast({ title: 'Error', variant: 'destructive' });
        return;
      }

      // If recurring, create next occurrence
      if (task.is_recurring && task.recurring_frequency) {
        let nextDate = new Date();
        if (task.recurring_frequency === 'daily') {
          nextDate = addDays(nextDate, 1);
        } else if (task.recurring_frequency === 'weekly') {
          nextDate = addWeeks(nextDate, 1);
        }

        await supabase.from('tasks').insert({
          title: task.title,
          type: 'recurring',
          due_date: nextDate.toISOString(),
          is_recurring: true,
          recurring_frequency: task.recurring_frequency,
          user_id: user!.id,
          position: tasks.length + 1,
        });
      }

      toast({ title: '✅ ¡Tarea completada!' });
    }

    fetchTasks();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error al eliminar', variant: 'destructive' });
      return;
    }
    toast({ title: '✅ Tarea eliminada' });
    fetchTasks();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);

      const newTasks = arrayMove(tasks, oldIndex, newIndex);
      setTasks(newTasks);

      // Update positions in DB
      for (let i = 0; i < newTasks.length; i++) {
        await supabase
          .from('tasks')
          .update({ position: i })
          .eq('id', newTasks[i].id);
      }
    }
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      type: task.type,
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      recurring_frequency: task.recurring_frequency || '',
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'simple',
      due_date: '',
      recurring_frequency: '',
    });
    setEditingTask(null);
    setIsDialogOpen(false);
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
          <h1 className="text-2xl font-bold text-foreground">Pendientes</h1>
          <p className="text-muted-foreground">Tus tareas de verdad importantes</p>
        </div>
        <Button
          className="gradient-primary shadow-soft"
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar pendiente
        </Button>
      </div>

      {/* Quick add */}
      <form onSubmit={handleQuickAdd} className="flex gap-2">
        <Input
          placeholder="Agregar tarea rápida..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" variant="secondary">
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: 'all', label: 'Todas' },
          { value: 'today', label: 'Hoy' },
          { value: 'week', label: 'Esta semana' },
          { value: 'no-date', label: 'Sin fecha' },
          { value: 'team', label: 'Para equipo' },
        ].map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f.value as FilterType)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <Card className="glass">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground">No hay tareas</h3>
            <p className="text-muted-foreground text-center mt-2">
              {filter === 'all'
                ? 'Crea tu primera tarea para empezar'
                : 'No hay tareas con este filtro'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredTasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {filteredTasks.map((task) => (
                <SortableTask
                  key={task.id}
                  task={task}
                  onToggle={handleToggle}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Dialog for creating/editing */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTask ? 'Editar tarea' : 'Nueva tarea'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v as Task['type'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <config.icon className={`h-4 w-4 ${config.color}`} />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(formData.type === 'deadline' || formData.type === 'recurring') && (
              <div className="space-y-2">
                <Label htmlFor="due_date">Fecha límite</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            )}

            {formData.type === 'recurring' && (
              <div className="space-y-2">
                <Label>Frecuencia</Label>
                <Select
                  value={formData.recurring_frequency}
                  onValueChange={(v) => setFormData({ ...formData, recurring_frequency: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona frecuencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diaria</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit" className="gradient-primary">
                {editingTask ? 'Guardar cambios' : 'Crear tarea'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tasks;

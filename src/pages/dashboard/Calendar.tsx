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
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Loader2,
  AlertTriangle,
  Trash2,
  Edit,
} from 'lucide-react';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  addWeeks,
  subWeeks,
  isToday,
  differenceInDays,
} from 'date-fns';
import { es } from 'date-fns/locale';

interface CalendarEvent {
  id: string;
  title: string;
  type: string;
  start_time: string;
  end_time: string | null;
  subject_id: string | null;
}

interface Subject {
  id: string;
  name: string;
  color: string;
  deadline_convenio: string | null;
}

interface Task {
  id: string;
  title: string;
  due_date: string | null;
}

const eventTypeConfig = {
  exam: { label: 'Parcial', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300', emoji: '📝' },
  deadline: { label: 'Entrega', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300', emoji: '📅' },
  meeting: { label: 'Reunión equipo', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', emoji: '👥' },
  holiday: { label: 'Feriado', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300', emoji: '🎉' },
  event: { label: 'Evento', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300', emoji: '📌' },
};

type EventType = 'exam' | 'deadline' | 'meeting' | 'holiday' | 'event';

interface ExtendedEvent extends CalendarEvent {
  isTask?: boolean;
}

const CalendarPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<ExtendedEvent | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'event' as EventType,
    start_time: '',
    subject_id: '',
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    const [eventsRes, subjectsRes, tasksRes] = await Promise.all([
      supabase.from('events').select('*').order('start_time'),
      supabase.from('subjects').select('id, name, color, deadline_convenio'),
      supabase.from('tasks').select('id, title, due_date').not('due_date', 'is', null),
    ]);

    setEvents(eventsRes.data || []);
    setSubjects(subjectsRes.data || []);
    setTasks(tasksRes.data || []);
    setIsLoading(false);
  };

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getEventsForDay = (date: Date): ExtendedEvent[] => {
    const dayEvents = events
      .filter((e) => isSameDay(new Date(e.start_time), date))
      .map((e) => ({ ...e, isTask: false }));

    // Add tasks with due dates
    const dayTasks = tasks
      .filter((t) => t.due_date && isSameDay(new Date(t.due_date), date))
      .map((t) => ({
        id: `task-${t.id}`,
        title: t.title,
        type: 'deadline' as EventType,
        start_time: t.due_date!,
        end_time: null,
        subject_id: null,
        isTask: true,
      }));

    return [...dayEvents, ...dayTasks];
  };

  const getConvenioAlerts = () => {
    return subjects
      .filter((s) => {
        if (!s.deadline_convenio) return false;
        const days = differenceInDays(new Date(s.deadline_convenio), new Date());
        return days >= 0 && days <= 7;
      })
      .map((s) => ({
        subject: s.name,
        daysLeft: differenceInDays(new Date(s.deadline_convenio!), new Date()),
        date: s.deadline_convenio!,
      }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingEvent && !editingEvent.isTask) {
      // Update existing event
      const { error } = await supabase
        .from('events')
        .update({
          title: formData.title,
          type: formData.type,
          start_time: formData.start_time,
          subject_id: formData.subject_id || null,
        })
        .eq('id', editingEvent.id);

      if (error) {
        toast({ title: 'Error al actualizar evento', variant: 'destructive' });
        return;
      }

      toast({ title: '✅ Evento actualizado' });
    } else {
      // Create new event
      const { error } = await supabase.from('events').insert({
        title: formData.title,
        type: formData.type,
        start_time: formData.start_time,
        subject_id: formData.subject_id || null,
        user_id: user!.id,
      });

      if (error) {
        toast({ title: 'Error al crear evento', variant: 'destructive' });
        return;
      }

      toast({ title: '✅ Evento creado' });
    }

    resetForm();
    fetchData();
  };

  const handleDelete = async () => {
    if (!editingEvent || editingEvent.isTask) return;

    const { error } = await supabase.from('events').delete().eq('id', editingEvent.id);

    if (error) {
      toast({ title: 'Error al eliminar evento', variant: 'destructive' });
      return;
    }

    toast({ title: '✅ Evento eliminado' });
    resetForm();
    fetchData();
  };

  const openEditDialog = (event: ExtendedEvent) => {
    if (event.isTask) {
      toast({ title: 'Las tareas no se pueden editar desde aquí', variant: 'default' });
      return;
    }

    setEditingEvent(event);
    setFormData({
      title: event.title,
      type: event.type as EventType,
      start_time: format(new Date(event.start_time), "yyyy-MM-dd'T'HH:mm"),
      subject_id: event.subject_id || '',
    });
    setIsDialogOpen(true);
  };

  const openQuickAdd = (date: Date) => {
    setSelectedDate(date);
    setFormData({
      ...formData,
      start_time: format(date, "yyyy-MM-dd'T'HH:mm"),
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'event',
      start_time: '',
      subject_id: '',
    });
    setSelectedDate(null);
    setEditingEvent(null);
    setIsDialogOpen(false);
  };

  const convenioAlerts = getConvenioAlerts();

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
          <h1 className="text-2xl font-bold text-foreground">Calendario Académico</h1>
          <p className="text-muted-foreground">Tu semana de un vistazo</p>
        </div>
        <Button
          className="gradient-primary shadow-soft"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar evento
        </Button>
      </div>

      {/* Convenio alerts */}
      {convenioAlerts.length > 0 && (
        <div className="space-y-2">
          {convenioAlerts.map((alert) => (
            <Card
              key={alert.subject}
              className="border-accent bg-accent/10"
            >
              <CardContent className="flex items-center gap-3 py-3">
                <AlertTriangle className="h-5 w-5 text-accent" />
                <span className="text-sm">
                  <strong>{alert.subject}</strong>: Cierre de convenio en{' '}
                  {alert.daysLeft === 0 ? 'HOY' : `${alert.daysLeft} días`} (
                  {format(new Date(alert.date), 'dd/MM')})
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-medium">
          {format(weekStart, "d 'de' MMMM", { locale: es })} -{' '}
          {format(weekEnd, "d 'de' MMMM yyyy", { locale: es })}
        </h2>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[150px] rounded-xl p-2 cursor-pointer transition-all hover:bg-muted/50 ${
                isCurrentDay ? 'bg-primary/10 ring-2 ring-primary' : 'bg-card'
              }`}
              onClick={() => openQuickAdd(day)}
            >
              <div className="text-center mb-2">
                <p className="text-xs text-muted-foreground uppercase">
                  {format(day, 'EEE', { locale: es })}
                </p>
                <p
                  className={`text-lg font-bold ${
                    isCurrentDay ? 'text-primary' : ''
                  }`}
                >
                  {format(day, 'd')}
                </p>
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => {
                  const config = eventTypeConfig[event.type];
                  return (
                    <div
                      key={event.id}
                      className={`text-xs p-1.5 rounded truncate ${config.color} cursor-pointer hover:opacity-80 transition-opacity font-medium`}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(event);
                      }}
                      title="Haz clic para editar"
                    >
                      {config.emoji} {event.title}
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{dayEvents.length - 3} más
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create/Edit dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEvent
                ? 'Editar evento'
                : selectedDate
                  ? `Nuevo evento - ${format(selectedDate, "d 'de' MMMM", { locale: es })}`
                  : 'Nuevo evento'}
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
                onValueChange={(v) => setFormData({ ...formData, type: v as Event['type'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(eventTypeConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.emoji} {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_time">Fecha y hora</Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Materia (opcional)</Label>
              <Select
                value={formData.subject_id}
                onValueChange={(v) => setFormData({ ...formData, subject_id: v })}
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

            <div className="flex gap-2 justify-between">
              {editingEvent && !editingEvent.isTask && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit" className="gradient-primary">
                  {editingEvent ? 'Guardar cambios' : 'Crear evento'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarPage;

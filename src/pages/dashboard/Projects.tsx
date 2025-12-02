import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  Plus,
  FolderKanban,
  Clock,
  Trash2,
  Loader2,
  Flag,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  deadline: string | null;
  progress: number | null;
}

interface ChecklistItem {
  id: string;
  project_id: string;
  text: string;
  is_complete: boolean;
  position: number;
}

interface Milestone {
  id: string;
  project_id: string;
  name: string;
  date: string | null;
  position: number;
}

const statusConfig = {
  planning: { label: '🗂️ Planeación', color: 'bg-muted' },
  in_progress: { label: '📊 En progreso', color: 'bg-primary/20' },
  review: { label: '🧪 En revisión', color: 'bg-accent/20' },
  delivered: { label: '✅ Entregado', color: 'bg-secondary/20' },
};

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [checklist, setChecklist] = useState<Record<string, ChecklistItem[]>>({});
  const [milestones, setMilestones] = useState<Record<string, Milestone[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newMilestone, setNewMilestone] = useState({ name: '', date: '' });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
  });

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error al cargar proyectos', variant: 'destructive' });
      return;
    }

    setProjects(data || []);

    // Fetch checklist and milestones for each project
    const checklistMap: Record<string, ChecklistItem[]> = {};
    const milestonesMap: Record<string, Milestone[]> = {};

    for (const project of data || []) {
      const { data: checklistData } = await supabase
        .from('project_checklist')
        .select('*')
        .eq('project_id', project.id)
        .order('position');
      checklistMap[project.id] = checklistData || [];

      const { data: milestonesData } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', project.id)
        .order('position');
      milestonesMap[project.id] = milestonesData || [];
    }

    setChecklist(checklistMap);
    setMilestones(milestonesMap);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('projects').insert({
      title: formData.title,
      description: formData.description || null,
      deadline: formData.deadline || null,
      user_id: user!.id,
      status: 'planning',
      progress: 0,
    });

    if (error) {
      toast({ title: 'Error al crear proyecto', variant: 'destructive' });
      return;
    }

    toast({ title: '✅ Proyecto creado' });
    resetForm();
    fetchProjects();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error al eliminar', variant: 'destructive' });
      return;
    }
    toast({ title: '✅ Proyecto eliminado' });
    setSelectedProject(null);
    fetchProjects();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const projectId = active.id as string;
    const newStatus = over.id as Project['status'];

    const { error } = await supabase
      .from('projects')
      .update({ status: newStatus })
      .eq('id', projectId);

    if (error) {
      toast({ title: 'Error al mover proyecto', variant: 'destructive' });
      return;
    }

    fetchProjects();
  };

  const addChecklistItem = async () => {
    if (!newChecklistItem.trim() || !selectedProject) return;

    const items = checklist[selectedProject.id] || [];
    const { error } = await supabase.from('project_checklist').insert({
      project_id: selectedProject.id,
      text: newChecklistItem,
      position: items.length,
    });

    if (error) {
      toast({ title: 'Error', variant: 'destructive' });
      return;
    }

    setNewChecklistItem('');
    fetchProjects();
    updateProgress(selectedProject.id);
  };

  const toggleChecklistItem = async (item: ChecklistItem) => {
    const { error } = await supabase
      .from('project_checklist')
      .update({ is_complete: !item.is_complete })
      .eq('id', item.id);

    if (error) {
      toast({ title: 'Error', variant: 'destructive' });
      return;
    }

    fetchProjects();
    updateProgress(item.project_id);
  };

  const updateProgress = async (projectId: string) => {
    const { data } = await supabase
      .from('project_checklist')
      .select('*')
      .eq('project_id', projectId);

    if (!data || data.length === 0) return;

    const completed = data.filter((i) => i.is_complete).length;
    const progress = Math.round((completed / data.length) * 100);

    await supabase.from('projects').update({ progress }).eq('id', projectId);
  };

  const addMilestone = async () => {
    if (!newMilestone.name.trim() || !selectedProject) return;

    const items = milestones[selectedProject.id] || [];
    const { error } = await supabase.from('project_milestones').insert({
      project_id: selectedProject.id,
      name: newMilestone.name,
      date: newMilestone.date || null,
      position: items.length,
    });

    if (error) {
      toast({ title: 'Error', variant: 'destructive' });
      return;
    }

    setNewMilestone({ name: '', date: '' });
    fetchProjects();
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', deadline: '' });
    setIsDialogOpen(false);
  };

  const getProjectsByStatus = (status: Project['status']) =>
    projects.filter((p) => p.status === status);

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
          <h1 className="text-2xl font-bold text-foreground">Proyectos en Marcha</h1>
          <p className="text-muted-foreground">Gestiona tus proyectos con Kanban</p>
        </div>
        <Button
          className="gradient-primary shadow-soft"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo proyecto
        </Button>
      </div>

      {/* Kanban board */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.keys(statusConfig) as Project['status'][]).map((status) => (
            <div
              key={status}
              id={status}
              className={`rounded-xl p-4 min-h-[300px] ${statusConfig[status].color}`}
            >
              <h3 className="font-medium mb-4">{statusConfig[status].label}</h3>
              <div className="space-y-3">
                {getProjectsByStatus(status).map((project) => (
                  <Card
                    key={project.id}
                    className="cursor-pointer hover:shadow-soft transition-all"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', project.id);
                    }}
                    onClick={() => setSelectedProject(project)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{project.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {project.deadline && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(project.deadline), 'dd MMM', { locale: es })}
                        </div>
                      )}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Progreso</span>
                          <span>{project.progress}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                      {/* Mini timeline */}
                      {milestones[project.id]?.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {milestones[project.id].slice(0, 4).map((m, i) => (
                            <div
                              key={m.id}
                              className="h-1 flex-1 bg-primary/50 rounded-full"
                              title={m.name}
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {getProjectsByStatus(status).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Sin proyectos
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </DndContext>

      {projects.length === 0 && (
        <Card className="glass">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground">No tienes proyectos aún</h3>
            <p className="text-muted-foreground text-center mt-2">
              Crea tu primer proyecto para empezar a organizar
            </p>
          </CardContent>
        </Card>
      )}

      {/* Create dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo proyecto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Nombre del proyecto</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Fecha límite</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit" className="gradient-primary">
                Crear proyecto
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Project details sheet */}
      <Sheet open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedProject && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedProject.title}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {selectedProject.description && (
                  <p className="text-muted-foreground">{selectedProject.description}</p>
                )}

                {selectedProject.deadline && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Fecha límite: {format(new Date(selectedProject.deadline), 'dd MMMM yyyy', { locale: es })}
                    </span>
                  </div>
                )}

                {/* Checklist */}
                <div className="space-y-3">
                  <Label>Checklist ({checklist[selectedProject.id]?.filter(i => i.is_complete).length || 0}/{checklist[selectedProject.id]?.length || 0})</Label>
                  <div className="space-y-2">
                    {(checklist[selectedProject.id] || []).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted"
                      >
                        <Checkbox
                          checked={item.is_complete}
                          onCheckedChange={() => toggleChecklistItem(item)}
                        />
                        <span className={item.is_complete ? 'line-through text-muted-foreground' : ''}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Agregar ítem..."
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
                    />
                    <Button variant="secondary" size="icon" onClick={addChecklistItem}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Milestones */}
                <div className="space-y-3">
                  <Label>Hitos</Label>
                  <div className="space-y-2">
                    {(milestones[selectedProject.id] || []).map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted"
                      >
                        <Flag className="h-4 w-4 text-primary" />
                        <span className="flex-1">{m.name}</span>
                        {m.date && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(m.date), 'dd MMM', { locale: es })}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nombre del hito..."
                      value={newMilestone.name}
                      onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
                    />
                    <Input
                      type="date"
                      value={newMilestone.date}
                      onChange={(e) => setNewMilestone({ ...newMilestone, date: e.target.value })}
                      className="w-40"
                    />
                    <Button variant="secondary" size="icon" onClick={addMilestone}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => handleDelete(selectedProject.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar proyecto
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Projects;

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  FileText,
  Star,
  StarOff,
  Pencil,
  Trash2,
  BookOpen,
  Tag,
  Loader2,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Note {
  id: string;
  title: string;
  content: string;
  subject_id: string | null;
  tags: string[] | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  subjects?: {
    name: string;
    color: string;
  } | null;
}

interface Subject {
  id: string;
  name: string;
  color: string;
}

const Notes = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterFavorite, setFilterFavorite] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    subject_id: '',
    tags: [] as string[],
  });

  useEffect(() => {
    if (user) {
      fetchNotes();
      fetchSubjects();
    }
  }, [user]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching notes:', error);
        toast({ 
          title: 'Error al cargar notas', 
          description: error.message,
          variant: 'destructive' 
        });
        setIsLoading(false);
        return;
      }

      // Fetch subjects data separately and merge
      const notesWithSubjects = await Promise.all(
        (data || []).map(async (note) => {
          if (note.subject_id) {
            try {
              const { data: subjectData } = await supabase
                .from('subjects')
                .select('name, color')
                .eq('id', note.subject_id)
                .single();
              
              return {
                ...note,
                subjects: subjectData || null,
              };
            } catch (err) {
              // If subject doesn't exist, just return note without subject
              return {
                ...note,
                subjects: null,
              };
            }
          }
          return {
            ...note,
            subjects: null,
          };
        })
      );

      setNotes(notesWithSubjects);
      setIsLoading(false);
    } catch (err) {
      console.error('Unexpected error:', err);
      toast({ 
        title: 'Error inesperado', 
        description: 'Por favor recarga la página',
        variant: 'destructive' 
      });
      setIsLoading(false);
    }
  };

  const fetchSubjects = async () => {
    const { data } = await supabase
      .from('subjects')
      .select('id, name, color')
      .order('name');

    setSubjects(data || []);
  };

  const filteredNotes = notes.filter((note) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.tags?.some((tag) => tag.toLowerCase().includes(query));

      if (!matchesSearch) return false;
    }

    // Subject filter
    if (filterSubject !== 'all' && note.subject_id !== filterSubject) {
      return false;
    }

    // Favorite filter
    if (filterFavorite && !note.is_favorite) {
      return false;
    }

    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({ title: 'El título es requerido', variant: 'destructive' });
      return;
    }

    const payload = {
      title: formData.title,
      content: formData.content,
      subject_id: formData.subject_id || null,
      tags: formData.tags,
      user_id: user!.id,
    };

    if (editingNote) {
      const { error } = await supabase
        .from('notes')
        .update(payload)
        .eq('id', editingNote.id);

      if (error) {
        toast({ title: 'Error al actualizar nota', variant: 'destructive' });
        return;
      }

      toast({ title: '✅ Nota actualizada' });
    } else {
      const { error } = await supabase.from('notes').insert(payload);

      if (error) {
        toast({ title: 'Error al crear nota', variant: 'destructive' });
        return;
      }

      toast({ title: '✅ Nota creada' });
    }

    resetForm();
    fetchNotes();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta nota?')) return;

    const { error } = await supabase.from('notes').delete().eq('id', id);

    if (error) {
      toast({ title: 'Error al eliminar nota', variant: 'destructive' });
      return;
    }

    toast({ title: '✅ Nota eliminada' });
    fetchNotes();
  };

  const handleToggleFavorite = async (note: Note) => {
    const { error } = await supabase
      .from('notes')
      .update({ is_favorite: !note.is_favorite })
      .eq('id', note.id);

    if (error) {
      toast({ title: 'Error al actualizar favorito', variant: 'destructive' });
      return;
    }

    fetchNotes();
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      subject_id: note.subject_id || '',
      tags: note.tags || [],
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      subject_id: '',
      tags: [],
    });
    setEditingNote(null);
    setIsDialogOpen(false);
    setNewTag('');
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()],
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 dark:from-purple-400 dark:via-indigo-400 dark:to-blue-400 bg-clip-text text-transparent">
            Notas y Apuntes
          </h1>
          <p className="text-muted-foreground mt-2">
            Organiza tus apuntes y notas de estudio
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva Nota
        </Button>
      </div>

      {/* Filters */}
      <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-2 border-purple-200/50 dark:border-purple-800/50">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar en notas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-2 border-purple-200/50 dark:border-purple-800/50"
              />
            </div>

            {/* Subject Filter */}
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-full md:w-[200px] border-2 border-purple-200/50 dark:border-purple-800/50">
                <SelectValue placeholder="Todas las materias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las materias</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Favorite Filter */}
            <Button
              variant={filterFavorite ? 'default' : 'outline'}
              onClick={() => setFilterFavorite(!filterFavorite)}
              className="border-2 border-purple-200/50 dark:border-purple-800/50"
            >
              <Star className={`h-4 w-4 mr-2 ${filterFavorite ? 'fill-yellow-400' : ''}`} />
              Favoritos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-2 border-purple-200/50 dark:border-purple-800/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">
              {searchQuery || filterSubject !== 'all' || filterFavorite
                ? 'No se encontraron notas'
                : 'No tienes notas aún'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {searchQuery || filterSubject !== 'all' || filterFavorite
                ? 'Intenta con otros filtros'
                : 'Crea tu primera nota para comenzar'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <Card
              key={note.id}
              className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-2 border-purple-200/50 dark:border-purple-800/50 hover:shadow-lg transition-all duration-300 group cursor-pointer"
              onClick={() => handleEdit(note)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg font-semibold line-clamp-2 flex-1">
                    {note.title}
                  </CardTitle>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(note);
                    }}
                    className="flex-shrink-0 p-1 hover:bg-muted rounded"
                  >
                    {note.is_favorite ? (
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ) : (
                      <StarOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {note.subjects && (
                    <Badge
                      style={{ backgroundColor: `${note.subjects.color}20`, color: note.subjects.color }}
                      className="border"
                    >
                      <BookOpen className="h-3 w-3 mr-1" />
                      {note.subjects.name}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {note.content || 'Sin contenido'}
                </p>

                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {note.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        <Tag className="h-2.5 w-2.5 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(note.updated_at), "d MMM yyyy", { locale: es })}
                  </span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(note);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(note.id);
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingNote ? 'Editar Nota' : 'Nueva Nota'}
            </DialogTitle>
            <DialogDescription>
              {editingNote ? 'Modifica tu nota' : 'Crea una nueva nota o apunte'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Título de la nota"
                className="border-2 border-purple-200/50 dark:border-purple-800/50"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Materia</Label>
              <Select
                value={formData.subject_id}
                onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
              >
                <SelectTrigger className="border-2 border-purple-200/50 dark:border-purple-800/50">
                  <SelectValue placeholder="Selecciona una materia (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin materia</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Contenido</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Escribe tu nota aquí... (Soporta Markdown básico)"
                className="min-h-[300px] border-2 border-purple-200/50 dark:border-purple-800/50 resize-none font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Tip: Usa **texto** para negrita, *texto* para cursiva
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Etiquetas</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Agregar etiqueta"
                  className="border-2 border-purple-200/50 dark:border-purple-800/50"
                />
                <Button type="button" onClick={addTag} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              >
                {editingNote ? 'Actualizar' : 'Crear'} Nota
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notes;


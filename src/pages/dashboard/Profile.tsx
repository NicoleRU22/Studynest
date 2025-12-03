import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  User,
  Mail,
  Camera,
  Save,
  Loader2,
  Target,
  BookOpen,
  Upload,
  X,
} from 'lucide-react';

const universities = [
  'Universidad Nacional Mayor de San Marcos (UNMSM)',
  'Pontificia Universidad Católica del Perú (PUCP)',
  'Universidad Nacional de Ingeniería (UNI)',
  'Universidad Peruana Cayetano Heredia (UPCH)',
  'Universidad del Pacífico (UP)',
  'Universidad de Lima (UL)',
  'Universidad Nacional Agraria La Molina (UNALM)',
  'Universidad Tecnológica del Perú (UTP)',
  'Universidad Nacional San Antonio Abad del Cusco (UNSAAC)',
  'Universidad Nacional de San Agustín de Arequipa (UNSA)',
  'Otra',
];

export default function Profile() {
  const { profile, user, updateProfile, fetchProfile } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [university, setUniversity] = useState('');
  const [customUniversity, setCustomUniversity] = useState('');
  const [semesterGoal, setSemesterGoal] = useState('');
  const [dailyLearnings, setDailyLearnings] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setEmail(profile.email || '');
      setUniversity(profile.university || '');
      setSemesterGoal(profile.semester_goal || '');
      setDailyLearnings(profile.daily_learnings || '');
      // @ts-ignore - avatar_url might not be in types yet
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Por favor selecciona una imagen válida',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'La imagen debe ser menor a 5MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create or get avatar bucket
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        // Try to create bucket if it doesn't exist
        if (uploadError.message.includes('Bucket not found')) {
          // Note: Bucket creation should be done in Supabase dashboard
          toast({
            title: 'Error',
            description: 'El bucket de avatares no existe. Contacta al administrador.',
            variant: 'destructive',
          });
          setIsUploading(false);
          return;
        }
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      await fetchProfile(user.id);
      
      toast({
        title: 'Foto actualizada',
        description: 'Tu foto de perfil se ha actualizado correctamente.',
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Error al subir foto',
        description: error.message || 'Ocurrió un error al subir la imagen',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user || !avatarUrl) return;

    try {
      // Extract file path from URL
      const urlParts = avatarUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `avatars/${fileName}`;

      // Delete from storage
      await supabase.storage.from('avatars').remove([filePath]);

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', user.id);

      if (error) throw error;

      setAvatarUrl(null);
      await fetchProfile(user.id);

      toast({
        title: 'Foto eliminada',
        description: 'Tu foto de perfil se ha eliminado correctamente.',
      });
    } catch (error: any) {
      console.error('Error removing avatar:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la foto',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const finalUniversity = university === 'Otra' ? customUniversity : university;
    
    await updateProfile({
      name,
      university: finalUniversity || null,
      semester_goal: semesterGoal || null,
      daily_learnings: dailyLearnings || null,
    });

    setIsSaving(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 dark:from-purple-400 dark:via-indigo-400 dark:to-blue-400 bg-clip-text text-transparent">
          Mi Perfil
        </h1>
        <p className="text-muted-foreground mt-2">
          Gestiona tu información personal y preferencias
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Avatar Section */}
        <Card className="md:col-span-2 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-2 border-purple-200/50 dark:border-purple-800/50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Foto de Perfil
            </CardTitle>
            <CardDescription>
              Sube una foto para personalizar tu perfil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-indigo-400 flex items-center justify-center shadow-lg overflow-hidden">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12 text-white" />
                  )}
                </div>
                {avatarUrl && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload"
                />
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      {avatarUrl ? 'Cambiar foto' : 'Subir foto'}
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Formatos: JPG, PNG, GIF. Máximo 5MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-2 border-purple-200/50 dark:border-purple-800/50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Información Personal
            </CardTitle>
            <CardDescription>
              Actualiza tu información básica
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nombre completo
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className="border-2 border-purple-200/50 dark:border-purple-800/50 focus:border-purple-500 dark:focus:border-purple-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-muted border-2 border-purple-200/50 dark:border-purple-800/50"
              />
              <p className="text-xs text-muted-foreground">
                El correo no se puede cambiar
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="university" className="flex items-center gap-2">
                Universidad
              </Label>
              <Select value={university} onValueChange={setUniversity}>
                <SelectTrigger className="border-2 border-purple-200/50 dark:border-purple-800/50 focus:border-purple-500 dark:focus:border-purple-400">
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
              {university === 'Otra' && (
                <Input
                  value={customUniversity}
                  onChange={(e) => setCustomUniversity(e.target.value)}
                  placeholder="Escribe el nombre de tu universidad"
                  className="mt-2 border-2 border-purple-200/50 dark:border-purple-800/50 focus:border-purple-500 dark:focus:border-purple-400"
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Academic Goals */}
        <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-2 border-purple-200/50 dark:border-purple-800/50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Metas Académicas
            </CardTitle>
            <CardDescription>
              Define tus objetivos y aprendizajes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="semester-goal" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Meta del semestre
              </Label>
              <Textarea
                id="semester-goal"
                value={semesterGoal}
                onChange={(e) => setSemesterGoal(e.target.value)}
                placeholder="¿Cuál es tu objetivo principal este semestre?"
                className="min-h-[100px] border-2 border-purple-200/50 dark:border-purple-800/50 focus:border-purple-500 dark:focus:border-purple-400 resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="daily-learnings" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Aprendizajes diarios
              </Label>
              <Textarea
                id="daily-learnings"
                value={dailyLearnings}
                onChange={(e) => setDailyLearnings(e.target.value)}
                placeholder="¿Qué has aprendido hoy?"
                className="min-h-[100px] border-2 border-purple-200/50 dark:border-purple-800/50 focus:border-purple-500 dark:focus:border-purple-400 resize-none"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={handleSave}
          disabled={isSaving || !name.trim()}
          className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white font-semibold shadow-lg shadow-purple-500/40 dark:shadow-purple-900/40 hover:shadow-xl transition-all duration-300"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar cambios
            </>
          )}
        </Button>
      </div>
    </div>
  );
}


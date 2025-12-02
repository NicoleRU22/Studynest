import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useThemeStore } from '@/stores/themeStore';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  CheckSquare,
  FolderKanban,
  Calendar,
  Leaf,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  Sparkles,
  User,
  FileText,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', icon: BookOpen, label: 'Mis Materias' },
  { to: '/dashboard/notes', icon: FileText, label: 'Notas' },
  { to: '/dashboard/tasks', icon: CheckSquare, label: 'Pendientes' },
  { to: '/dashboard/projects', icon: FolderKanban, label: 'Proyectos' },
  { to: '/dashboard/calendar', icon: Calendar, label: 'Calendario' },
  { to: '/dashboard/wellbeing', icon: Leaf, label: 'Mi Rincón' },
];

export const Sidebar = () => {
  const location = useLocation();
  const { signOut, profile } = useAuth();
  const { theme, toggleTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-gray-200/50 dark:border-gray-800/50 shadow-lg hover:shadow-xl transition-all duration-300"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40 w-72 bg-gradient-to-b from-white via-white to-gray-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950/50 border-r border-gray-200/60 dark:border-gray-800/60 backdrop-blur-xl transition-transform duration-300 ease-in-out shadow-xl lg:shadow-none',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-indigo-500/5 to-blue-500/5 dark:from-purple-500/10 dark:via-indigo-500/10 dark:to-blue-500/10 pointer-events-none"></div>
        
        <div className="flex flex-col h-full p-6 relative z-10">
          {/* Logo section */}
          <div className="flex items-center gap-4 px-3 mb-10 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/30 dark:shadow-purple-900/50 transform group-hover:scale-105 transition-transform duration-300">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 dark:from-purple-400 dark:via-indigo-400 dark:to-blue-400 bg-clip-text text-transparent">
                  StudyNest
                </h1>
                <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">
                  {profile?.name || 'Estudiante'}
                </p>
              </div>
            </div>
          </div>

          {/* User profile card */}
          <NavLink
            to="/dashboard/profile"
            onClick={() => setIsOpen(false)}
            className={cn(
              'w-full px-3 mb-6 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200/50 dark:border-purple-800/50 backdrop-blur-sm hover:from-purple-100 hover:to-indigo-100 dark:hover:from-purple-900/30 dark:hover:to-indigo-900/30 hover:border-purple-300/50 dark:hover:border-purple-700/50 hover:shadow-md transition-all duration-300 group',
              location.pathname === '/dashboard/profile' && 'ring-2 ring-purple-500/50 dark:ring-purple-400/50'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-400 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                  {/* @ts-ignore */}
                  {profile?.avatar_url ? (
                    <img
                      // @ts-ignore
                      src={profile.avatar_url}
                      alt={profile?.name || 'Usuario'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-white" />
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
                  {profile?.name || 'Usuario'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {profile?.university || 'Estudiante'}
                </p>
              </div>
            </div>
          </NavLink>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navItems.map((item, index) => {
              const isActive = location.pathname === item.to || 
                (item.to === '/dashboard' && location.pathname === '/dashboard');
              
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsOpen(false)}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className={cn(
                    'group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative overflow-hidden',
                    isActive
                      ? 'bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 text-white shadow-lg shadow-purple-500/30 dark:shadow-purple-900/50 transform scale-[1.02]'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 dark:hover:from-purple-900/20 dark:hover:to-indigo-900/20 hover:shadow-md hover:transform hover:translate-x-1'
                  )}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                  )}
                  
                  {/* Icon */}
                  <div className={cn(
                    'relative z-10 transition-transform duration-300',
                    isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400',
                    'group-hover:scale-110'
                  )}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  
                  {/* Label */}
                  <span className="relative z-10 flex-1">{item.label}</span>
                  
                  {/* Hover effect */}
                  {!isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-indigo-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:via-indigo-500/5 group-hover:to-blue-500/5 transition-all duration-300"></div>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Bottom actions */}
          <div className="space-y-2 pt-6 border-t border-gray-200/60 dark:border-gray-800/60">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 dark:hover:from-purple-900/20 dark:hover:to-indigo-900/20 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300 group"
              onClick={toggleTheme}
            >
              <div className={cn(
                'transition-transform duration-300 group-hover:rotate-12',
                theme === 'dark' ? 'text-yellow-500' : 'text-indigo-500'
              )}>
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </div>
              <span>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 transition-all duration-300 group"
              onClick={signOut}
            >
              <LogOut className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              <span>Cerrar sesión</span>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};

# 📚 StudyNest - Tu Nido de Productividad Académica

<div align="center">

![StudyNest Logo](https://img.shields.io/badge/StudyNest-Academic%20Productivity-purple?style=for-the-badge)

**Una aplicación web moderna diseñada para ayudar a estudiantes a organizar su vida académica de manera eficiente y efectiva.**

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4.19-646CFF?logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2.86.0-3ECF8E?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.17-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

</div>

---

## 🎯 ¿Qué es StudyNest?

**StudyNest** es una plataforma integral de gestión académica que permite a los estudiantes organizar sus materias, tareas, proyectos, calendario y notas en un solo lugar. Con un diseño moderno, intuitivo y funcionalidades completas, StudyNest ayuda a los estudiantes a mantener el control de su vida académica y mejorar su productividad.

### ✨ Características Principales

- 🎨 **Diseño Moderno**: Interfaz atractiva con gradientes, animaciones suaves y modo oscuro
- 🔐 **Autenticación Segura**: Sistema de login/registro con Supabase Auth
- 📱 **Totalmente Responsive**: Funciona perfectamente en desktop, tablet y móvil
- ⚡ **Rápido y Eficiente**: Construido con Vite para tiempos de carga ultrarrápidos
- 🎯 **Enfoque en Productividad**: Herramientas diseñadas específicamente para estudiantes

---

## 🚀 Funcionalidades

### 📖 Gestión de Materias
- Crear y organizar materias con colores personalizados
- Asociar profesores, horarios y fechas importantes
- Ver progreso de tareas por materia
- Notas y recordatorios por materia

### 📝 Sistema de Notas y Apuntes
- Editor de notas digitales completo
- Organización por materias
- Sistema de etiquetas (tags) para mejor organización
- Búsqueda full-text en todas las notas
- Marcar notas como favoritas
- Vista previa de contenido

### ✅ Gestión de Tareas
- Tareas simples y con fecha límite
- Tareas recurrentes (diarias, semanales, mensuales)
- Tareas en equipo
- Drag & drop para reordenar
- Filtros: hoy, esta semana, sin fecha, en equipo
- Vista rápida de tareas pendientes

### 📁 Gestión de Proyectos
- Crear proyectos con descripción y fecha límite
- Checklist de tareas por proyecto
- Hitos (milestones) para seguimiento
- Estados: planeación, en progreso, en revisión, entregado
- Barra de progreso visual
- Archivos adjuntos (próximamente)

### 📅 Calendario de Eventos
- Vista semanal de eventos
- Diferentes tipos: exámenes, entregas, reuniones, feriados
- Integración con tareas y materias
- Navegación entre semanas
- Eventos destacados visualmente

### 🌿 Rincón de Bienestar
- Establecer metas del semestre
- Registrar aprendizajes diarios
- Celebrar pequeños logros (small wins)
- Modo de respiración para relajación
- Seguimiento de bienestar personal

### 👤 Perfil de Usuario
- Editar información personal
- Subir foto de perfil
- Actualizar universidad
- Gestionar metas académicas
- Personalización completa

---

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 18.3.1** - Biblioteca de UI
- **TypeScript 5.8.3** - Tipado estático
- **Vite 5.4.19** - Build tool y dev server
- **React Router 6.30.1** - Navegación
- **Tailwind CSS 3.4.17** - Estilos
- **shadcn/ui** - Componentes UI
- **Radix UI** - Componentes accesibles
- **Lucide React** - Iconos
- **date-fns 3.6.0** - Manejo de fechas
- **@dnd-kit** - Drag and drop
- **Zustand 5.0.9** - Estado global
- **React Query 5.83.0** - Gestión de datos

### Backend & Base de Datos
- **Supabase 2.86.0** - Backend as a Service
  - Autenticación
  - Base de datos PostgreSQL
  - Row Level Security (RLS)
  - Storage para archivos

### Validación y Formularios
- **Zod 3.25.76** - Validación de esquemas
- **React Hook Form 7.61.1** - Manejo de formularios

### Herramientas de Desarrollo
- **ESLint** - Linter
- **TypeScript ESLint** - Linting de TypeScript
- **PostCSS** - Procesamiento de CSS
- **Autoprefixer** - Compatibilidad de CSS

---

## 📦 Instalación

### Prerrequisitos
- Node.js 18+ (recomendado 20+)
- npm o yarn
- Cuenta de Supabase (gratuita)

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/NicoleRU22/Studynest.git
cd studynest
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
Crea un archivo `.env` en la raíz del proyecto:
```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_PUBLISHABLE_KEY=tu_clave_publica_de_supabase
```

4. **Configurar Supabase**
   - Crea un proyecto en [Supabase](https://supabase.com)
   - Ejecuta las migraciones SQL en el SQL Editor:
     - `supabase/migrations/20251202214402_d3d78133-3b2f-4069-91bd-f4fc19417200.sql`
     - `supabase/migrations/20251202214413_27212c38-ef4f-45fd-b107-d17b34486a27.sql`
     - `supabase/migrations/20251202214414_add_notes.sql`

5. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

6. **Abrir en el navegador**
La aplicación estará disponible en `http://localhost:8080`

---

## 🏗️ Estructura del Proyecto

```
studynest/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── layout/          # Layout components (Sidebar, DashboardLayout)
│   │   └── ui/              # Componentes UI de shadcn
│   ├── pages/               # Páginas de la aplicación
│   │   ├── dashboard/       # Páginas del dashboard
│   │   │   ├── Subjects.tsx
│   │   │   ├── Notes.tsx
│   │   │   ├── Tasks.tsx
│   │   │   ├── Projects.tsx
│   │   │   ├── Calendar.tsx
│   │   │   ├── Wellbeing.tsx
│   │   │   └── Profile.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   └── Index.tsx
│   ├── hooks/               # Custom hooks
│   │   ├── useAuth.ts       # Hook de autenticación
│   │   └── use-toast.ts    # Hook de notificaciones
│   ├── stores/              # Estado global (Zustand)
│   │   ├── authStore.ts
│   │   └── themeStore.ts
│   ├── integrations/        # Integraciones externas
│   │   └── supabase/        # Cliente y tipos de Supabase
│   ├── lib/                 # Utilidades
│   │   └── utils.ts
│   ├── App.tsx              # Componente principal
│   └── main.tsx             # Punto de entrada
├── supabase/
│   └── migrations/          # Migraciones SQL
├── public/                   # Archivos estáticos
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🎨 Características de Diseño

### Paleta de Colores
- **Primarios**: Púrpura, Índigo, Azul (gradientes)
- **Modo Oscuro**: Soporte completo con transiciones suaves
- **Accesibilidad**: Contraste adecuado y navegación por teclado

### Componentes UI
- Sistema de diseño consistente con shadcn/ui
- Animaciones y transiciones fluidas
- Efectos glassmorphism
- Gradientes y sombras modernas
- Iconos intuitivos con Lucide React

---

## 🔒 Seguridad

- **Autenticación**: Supabase Auth con JWT
- **Row Level Security (RLS)**: Políticas de seguridad a nivel de base de datos
- **Validación**: Validación en frontend (Zod) y backend (Supabase)
- **Variables de entorno**: Credenciales protegidas
- **HTTPS**: Comunicación segura (en producción)

---

## 📱 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo en localhost:8080

# Producción
npm run build        # Construye la aplicación para producción
npm run build:dev    # Build en modo desarrollo
npm run preview      # Previsualiza el build de producción

# Calidad de código
npm run lint         # Ejecuta ESLint
```

---

## 🚧 Funcionalidades Futuras

- [ ] Sistema de flashcards para estudio
- [ ] Pomodoro timer integrado
- [ ] Dashboard de estadísticas y análisis
- [ ] Sistema de calificaciones (GPA tracker)
- [ ] Horario de clases semanal
- [ ] Grupos de estudio y colaboración
- [ ] Exportar notas a PDF
- [ ] Sincronización con calendarios externos
- [ ] Aplicación móvil (PWA)

Ver más detalles en [FUNCIONALIDADES_SUGERIDAS.md](./FUNCIONALIDADES_SUGERIDAS.md)

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Para cambios importantes:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto es privado. Todos los derechos reservados.

---

## 👤 Autora

**Nicole Ramirez**
- GitHub: [@NicoleRU22](https://github.com/NicoleRU22)
- Email: nicoleramirez2911@gmail.com

---

## 🙏 Agradecimientos

- [shadcn/ui](https://ui.shadcn.com/) por los componentes UI
- [Supabase](https://supabase.com/) por el backend
- [Vite](https://vitejs.dev/) por la experiencia de desarrollo
- [React](https://react.dev/) por el framework

---

<div align="center">

**Hecho con ❤️ para estudiantes que buscan organizarse mejor**

⭐ Si te gusta el proyecto, ¡dale una estrella!

</div>

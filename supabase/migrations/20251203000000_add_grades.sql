-- Create grades table for academic grades tracking
CREATE TABLE IF NOT EXISTS public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID,
  name TEXT NOT NULL,
  grade DECIMAL(5,2) NOT NULL CHECK (grade >= 0 AND grade <= 20),
  max_grade DECIMAL(5,2) NOT NULL DEFAULT 20 CHECK (max_grade > 0),
  weight DECIMAL(5,2) NOT NULL DEFAULT 1.0 CHECK (weight >= 0 AND weight <= 100),
  evaluation_type TEXT NOT NULL DEFAULT 'exam' CHECK (evaluation_type IN ('exam', 'homework', 'project', 'participation', 'quiz', 'other')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraint only if subjects table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subjects') THEN
    ALTER TABLE public.grades 
    ADD CONSTRAINT grades_subject_id_fkey 
    FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS grades_user_id_idx ON public.grades(user_id);
CREATE INDEX IF NOT EXISTS grades_subject_id_idx ON public.grades(subject_id);
CREATE INDEX IF NOT EXISTS grades_date_idx ON public.grades(date DESC);

-- Trigger for updated_at (only if function exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    DROP TRIGGER IF EXISTS update_grades_updated_at ON public.grades;
    CREATE TRIGGER update_grades_updated_at 
      BEFORE UPDATE ON public.grades 
      FOR EACH ROW 
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Enable RLS (Row Level Security)
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own grades
CREATE POLICY "Users can view own grades" ON public.grades
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own grades
CREATE POLICY "Users can insert own grades" ON public.grades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own grades
CREATE POLICY "Users can update own grades" ON public.grades
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own grades
CREATE POLICY "Users can delete own grades" ON public.grades
  FOR DELETE USING (auth.uid() = user_id);


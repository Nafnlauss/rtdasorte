-- Execute este script no Supabase SQL Editor para adicionar os campos de controle de progresso

-- Adicionar campos para controle de progresso manual
ALTER TABLE raffles 
ADD COLUMN IF NOT EXISTS progress_mode VARCHAR(10) DEFAULT 'real' CHECK (progress_mode IN ('real', 'manual')),
ADD COLUMN IF NOT EXISTS manual_progress INTEGER DEFAULT 0 CHECK (manual_progress >= 0 AND manual_progress <= 100);

-- Confirmar que os campos foram adicionados
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'raffles' 
AND column_name IN ('progress_mode', 'manual_progress');
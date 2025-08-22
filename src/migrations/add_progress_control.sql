-- Adicionar campos para controle de progresso manual
ALTER TABLE raffles 
ADD COLUMN IF NOT EXISTS progress_mode VARCHAR(10) DEFAULT 'real' CHECK (progress_mode IN ('real', 'manual')),
ADD COLUMN IF NOT EXISTS manual_progress INTEGER DEFAULT 0 CHECK (manual_progress >= 0 AND manual_progress <= 100);

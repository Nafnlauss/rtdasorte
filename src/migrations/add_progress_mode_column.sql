-- Adicionar coluna progress_mode à tabela raffles
ALTER TABLE raffles 
ADD COLUMN IF NOT EXISTS progress_mode text DEFAULT 'auto' CHECK (progress_mode IN ('auto', 'manual'));

-- Adicionar comentário explicativo
COMMENT ON COLUMN raffles.progress_mode IS 'Modo de controle da barra de progresso: auto (baseado em vendas reais) ou manual (valor definido manualmente)';
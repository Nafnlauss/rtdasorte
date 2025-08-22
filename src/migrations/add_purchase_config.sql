-- Adicionar campos de configuração de compra na tabela raffles
ALTER TABLE raffles 
ADD COLUMN IF NOT EXISTS purchase_config JSONB DEFAULT jsonb_build_object(
  'min_purchase', 1,
  'quick_buttons', jsonb_build_array(
    jsonb_build_object('quantity', 100, 'label', '+100', 'popular', false),
    jsonb_build_object('quantity', 250, 'label', '+250', 'popular', true),
    jsonb_build_object('quantity', 500, 'label', '+500', 'popular', false),
    jsonb_build_object('quantity', 750, 'label', '+750', 'popular', false),
    jsonb_build_object('quantity', 1000, 'label', '+1000', 'popular', false),
    jsonb_build_object('quantity', 1500, 'label', '+1500', 'popular', false)
  )
);

-- Comentário explicativo sobre a estrutura
COMMENT ON COLUMN raffles.purchase_config IS 'Configurações de compra: min_purchase (mínimo de números), quick_buttons (botões de quantidade rápida)';
-- Migração para tornar created_by opcional na tabela raffles
-- Permite criar rifas sem usuário autenticado (admin local)

-- 1. Remover a constraint de foreign key existente
ALTER TABLE raffles 
DROP CONSTRAINT IF EXISTS raffles_created_by_fkey;

-- 2. Tornar o campo created_by nullable (se ainda não for)
ALTER TABLE raffles 
ALTER COLUMN created_by DROP NOT NULL;

-- 3. Recriar a foreign key permitindo NULL
ALTER TABLE raffles 
ADD CONSTRAINT raffles_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES users(id) 
ON DELETE SET NULL;

-- 4. Verificar se a mudança foi aplicada
SELECT 
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns
WHERE table_name = 'raffles' 
AND column_name = 'created_by';
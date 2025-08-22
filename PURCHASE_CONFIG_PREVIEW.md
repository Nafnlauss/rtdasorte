# 🎯 Sistema de Configuração de Compra - Preview

## ✅ Implementado no Painel Administrativo

### 1. **Configuração de Quantidade Mínima**
- Campo para definir o mínimo de números que um cliente pode comprar
- Ex: Se definir 100, o cliente não pode comprar menos que 100 números
- O contador iniciará travado neste valor mínimo

### 2. **Configuração de Botões de Seleção Rápida (6 botões)**
Cada botão pode ser personalizado com:
- **Quantidade**: Número de bilhetes que adiciona
- **Rótulo**: Texto exibido no botão (ex: "+100", "+250")
- **Destaque**: Marcar um botão como "Mais Popular" (apenas 1 por vez)

### 3. **Interface Admin Criada**

#### Página de Edição/Criação de Rifa
- Nova seção "Configuração de Compra" adicionada
- Preview em tempo real das configurações
- Interface visual moderna com dark theme e accent verde

## 📋 Estrutura no Banco de Dados

```json
{
  "purchase_config": {
    "min_purchase": 100,
    "quick_buttons": [
      { "quantity": 100, "label": "+100", "popular": false },
      { "quantity": 250, "label": "+250", "popular": true },
      { "quantity": 500, "label": "+500", "popular": false },
      { "quantity": 750, "label": "+750", "popular": false },
      { "quantity": 1000, "label": "+1000", "popular": false },
      { "quantity": 1500, "label": "+1500", "popular": false }
    ]
  }
}
```

## 🎨 Como Ficará no Cliente (Quando Implementado)

### Interface de Compra do Cliente
```
┌─────────────────────────────────────────────┐
│  Selecione a quantidade de números          │
│                                              │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│  │ +100 │ │ +250 │ │ +500 │ │ +750 │       │
│  └──────┘ └──⭐──┘ └──────┘ └──────┘       │
│           Popular                            │
│                                              │
│  ┌──────┐ ┌──────┐                          │
│  │+1000 │ │+1500 │                          │
│  └──────┘ └──────┘                          │
│                                              │
│     [-]  [ 100 ]  [+]    Total: R$ 11,00    │
│          ↑                                   │
│    Não pode ser < 100                       │
│                                              │
│  [    🎲 Gerar Números Aleatórios    ]       │
└─────────────────────────────────────────────┘
```

## 🚀 Próximos Passos (Cliente)

Quando quiser implementar no cliente, basta:
1. Ler o `purchase_config` da rifa
2. Usar os botões configurados para seleção rápida
3. Aplicar a validação de quantidade mínima
4. O sistema já está preparado para isso!

## 💡 Benefícios

✅ **Para o Admin:**
- Controle total sobre as opções de compra
- Define estratégias de venda (mínimo alto = mais receita)
- Destaca opções populares para incentivar vendas

✅ **Para o Cliente:**
- Interface simplificada
- Seleção rápida com botões predefinidos
- Clareza sobre quantidade mínima

## 📝 Exemplo de Uso

### Cenário: Rifa de Carro
- **Mínimo**: 100 números (R$ 11,00)
- **Botão Popular**: +250 (incentiva compra maior)
- **Máximo sugerido**: +1500

### Cenário: Rifa de iPhone
- **Mínimo**: 10 números (R$ 5,00)  
- **Botão Popular**: +50 (valor médio)
- **Máximo sugerido**: +500

---

**Status**: ✅ Pronto no Admin | ⏳ Aguardando implementação no cliente
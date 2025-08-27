# Configuração de E-mail do Supabase para RT da Sorte

## Como configurar os templates de e-mail em português

### 1. Acesse o Painel do Supabase
1. Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione o projeto **"rifa rodrigo"**

### 2. Configure o Remetente do E-mail
1. No menu lateral, vá para **Authentication** → **Email Templates**
2. Em **Settings**, configure:
   - **Sender name**: RT da Sorte
   - **Sender email**: noreply@rtdasorte.com (ou seu domínio)

### 3. Configure o Template de Confirmação de E-mail

No menu **Email Templates**, selecione **Confirm signup** e substitua pelo seguinte:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .button {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 15px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎲 RT da Sorte</h1>
    <p style="margin: 0;">Bem-vindo à maior plataforma de rifas online!</p>
  </div>
  
  <div class="content">
    <h2>Confirme seu e-mail</h2>
    
    <p>Olá!</p>
    
    <p>Obrigado por se cadastrar na <strong>RT da Sorte</strong>! Para começar a participar das nossas rifas, por favor confirme seu endereço de e-mail clicando no botão abaixo:</p>
    
    <div style="text-align: center;">
      <a href="{{ .ConfirmationURL }}" class="button">Confirmar E-mail</a>
    </div>
    
    <p>Ou copie e cole este link no seu navegador:</p>
    <p style="background: #fff; padding: 10px; border: 1px solid #ddd; word-break: break-all;">
      {{ .ConfirmationURL }}
    </p>
    
    <p><strong>Por que confirmar seu e-mail?</strong></p>
    <ul>
      <li>Garantir a segurança da sua conta</li>
      <li>Receber notificações sobre suas rifas</li>
      <li>Ser avisado quando ganhar!</li>
    </ul>
    
    <p>Se você não se cadastrou na RT da Sorte, pode ignorar este e-mail.</p>
  </div>
  
  <div class="footer">
    <p>© 2025 RT da Sorte - Todos os direitos reservados</p>
    <p>Este é um e-mail automático, por favor não responda.</p>
  </div>
</body>
</html>
```

### 4. Configure o Redirecionamento

1. Ainda em **Authentication** → **URL Configuration**
2. Configure:
   - **Site URL**: https://seu-dominio.com (ou http://localhost:3000 para desenvolvimento)
   - **Redirect URLs**: 
     - Adicione: `https://seu-dominio.com/auth/confirm`
     - Para desenvolvimento: `http://localhost:3000/auth/confirm`

### 5. Template de Recuperação de Senha (Opcional)

Em **Email Templates** → **Reset Password**:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .button {
      display: inline-block;
      background: #10b981;
      color: white;
      padding: 15px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎲 RT da Sorte</h1>
    <p style="margin: 0;">Recuperação de Senha</p>
  </div>
  
  <div class="content">
    <h2>Redefinir sua senha</h2>
    
    <p>Olá!</p>
    
    <p>Recebemos uma solicitação para redefinir a senha da sua conta na RT da Sorte.</p>
    
    <div style="text-align: center;">
      <a href="{{ .ConfirmationURL }}" class="button">Redefinir Senha</a>
    </div>
    
    <p>Este link expira em 1 hora.</p>
    
    <p>Se você não solicitou a redefinição de senha, pode ignorar este e-mail com segurança.</p>
  </div>
  
  <div class="footer" style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
    <p>© 2025 RT da Sorte - Todos os direitos reservados</p>
  </div>
</body>
</html>
```

### 6. Configurar Rate Limiting (Importante!)

Em **Authentication** → **Settings**:
- **Enable email confirmations**: ✅ Ativado
- **Enable email change confirmations**: ✅ Ativado
- **Secure email change**: ✅ Ativado

## Variáveis de Ambiente

Certifique-se de que seu arquivo `.env.local` tenha:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xlabgxtdbasbohvowfod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
```

## Teste

1. Crie uma nova conta em `/register`
2. Verifique se o e-mail chegou com o template em português
3. Clique no link de confirmação
4. Você deve ser redirecionado para `/auth/confirm` e depois para `/login`

## Observações

- Os templates de e-mail são configurados diretamente no painel do Supabase
- As mudanças são aplicadas imediatamente
- Para usar um domínio personalizado no remetente, você precisará configurar SMTP personalizado
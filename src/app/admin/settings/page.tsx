'use client'

import { useState } from 'react'

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState({
    siteName: 'RT da Sorte',
    siteUrl: 'https://rtdasorte.com.br',
    supportEmail: 'suporte@rtdasorte.com.br',
    supportPhone: '+55 11 99999-9999',
    pixKey: 'pix@rtdasorte.com.br',
    pixName: 'RT da Sorte LTDA',
    pixCnpj: '00.000.000/0001-00',
    commissionRate: 10,
    minWithdraw: 50,
    maxTicketsPerUser: 100,
    autoDrawEnabled: true,
    emailNotifications: true,
    smsNotifications: false,
    whatsappNotifications: true,
  })

  const handleSave = () => {
    // Aqui você implementaria a lógica de salvar as configurações
    alert('Configurações salvas com sucesso!')
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações gerais da plataforma</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
            activeTab === 'general' 
              ? 'text-primary border-primary' 
              : 'text-muted-foreground border-transparent hover:text-foreground'
          }`}
        >
          Geral
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
            activeTab === 'payment' 
              ? 'text-primary border-primary' 
              : 'text-muted-foreground border-transparent hover:text-foreground'
          }`}
        >
          Pagamentos
        </button>
        <button
          onClick={() => setActiveTab('raffle')}
          className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
            activeTab === 'raffle' 
              ? 'text-primary border-primary' 
              : 'text-muted-foreground border-transparent hover:text-foreground'
          }`}
        >
          Rifas
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
            activeTab === 'notifications' 
              ? 'text-primary border-primary' 
              : 'text-muted-foreground border-transparent hover:text-foreground'
          }`}
        >
          Notificações
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
            activeTab === 'security' 
              ? 'text-primary border-primary' 
              : 'text-muted-foreground border-transparent hover:text-foreground'
          }`}
        >
          Segurança
        </button>
      </div>

      {/* Content */}
      <div className="raffle-card">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-4">Configurações Gerais</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Nome do Site</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">URL do Site</label>
                <input
                  type="url"
                  value={settings.siteUrl}
                  onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Email de Suporte</label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Telefone de Suporte</label>
                <input
                  type="tel"
                  value={settings.supportPhone}
                  onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-4">Configurações de Pagamento</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Chave PIX</label>
                <input
                  type="text"
                  value={settings.pixKey}
                  onChange={(e) => setSettings({ ...settings, pixKey: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Nome do Recebedor</label>
                <input
                  type="text"
                  value={settings.pixName}
                  onChange={(e) => setSettings({ ...settings, pixName: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">CNPJ</label>
                <input
                  type="text"
                  value={settings.pixCnpj}
                  onChange={(e) => setSettings({ ...settings, pixCnpj: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Taxa de Comissão (%)</label>
                <input
                  type="number"
                  value={settings.commissionRate}
                  onChange={(e) => setSettings({ ...settings, commissionRate: Number(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Saque Mínimo (R$)</label>
                <input
                  type="number"
                  value={settings.minWithdraw}
                  onChange={(e) => setSettings({ ...settings, minWithdraw: Number(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'raffle' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-4">Configurações de Rifas</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Máximo de Bilhetes por Usuário</label>
                <input
                  type="number"
                  value={settings.maxTicketsPerUser}
                  onChange={(e) => setSettings({ ...settings, maxTicketsPerUser: Number(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Sorteio Automático</label>
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.autoDrawEnabled}
                      onChange={(e) => setSettings({ ...settings, autoDrawEnabled: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                  <span className="text-sm">
                    {settings.autoDrawEnabled ? 'Ativado' : 'Desativado'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-4">Configurações de Notificações</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <div>
                  <p className="font-semibold">Notificações por Email</p>
                  <p className="text-sm text-muted-foreground">Enviar notificações importantes por email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-card rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <div>
                  <p className="font-semibold">Notificações por SMS</p>
                  <p className="text-sm text-muted-foreground">Enviar SMS para eventos críticos</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.smsNotifications}
                    onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-card rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <div>
                  <p className="font-semibold">Notificações por WhatsApp</p>
                  <p className="text-sm text-muted-foreground">Enviar mensagens via WhatsApp Business</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.whatsappNotifications}
                    onChange={(e) => setSettings({ ...settings, whatsappNotifications: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-card rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-4">Configurações de Segurança</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-yellow-500/10 border border-yellow-500 rounded-lg">
                <p className="text-yellow-500 font-semibold mb-2">⚠️ Área Sensível</p>
                <p className="text-sm">Alterações nesta seção podem afetar a segurança da plataforma.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Alterar Senha de Admin</label>
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="password"
                    placeholder="Nova senha"
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                  />
                  <input
                    type="password"
                    placeholder="Confirmar nova senha"
                    className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Autenticação de Dois Fatores</label>
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                  Configurar 2FA
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Backup do Banco de Dados</label>
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors">
                    Fazer Backup Agora
                  </button>
                  <button className="px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors">
                    Configurar Backup Automático
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-8 pt-6 border-t border-border flex justify-end gap-3">
          <button className="px-6 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors font-semibold">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  )
}
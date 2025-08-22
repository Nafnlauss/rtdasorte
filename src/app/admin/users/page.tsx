import { createClient } from '@/lib/supabase/server'

async function getUsers() {
  const supabase = await createClient()
  
  const { data: users, count } = await supabase
    .from('users')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(50)

  return { users: users || [], total: count || 0 }
}

export default async function AdminUsersPage() {
  const { users, total } = await getUsers()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Usuários</h1>
          <p className="text-muted-foreground">Gerencie os usuários cadastrados na plataforma</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-card rounded-lg px-4 py-2 border border-border">
            <p className="text-sm text-muted-foreground">Total de usuários</p>
            <p className="text-2xl font-bold">{total}</p>
          </div>
        </div>
      </div>

      {/* Barra de pesquisa */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Buscar por nome, email ou telefone..."
          className="flex-1 px-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none transition-colors"
        />
        <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold">
          Buscar
        </button>
      </div>

      {/* Tabela de usuários */}
      <div className="raffle-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="text-left p-4 font-semibold">Usuário</th>
                <th className="text-left p-4 font-semibold">Contato</th>
                <th className="text-left p-4 font-semibold">CPF</th>
                <th className="text-left p-4 font-semibold">Rifas Participadas</th>
                <th className="text-left p-4 font-semibold">Total Gasto</th>
                <th className="text-left p-4 font-semibold">Cadastro</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-8 text-muted-foreground">
                    Nenhum usuário cadastrado
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-t border-border hover:bg-secondary/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-sm font-bold">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold">{user.name || 'Sem nome'}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">{user.phone || '-'}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-mono">{user.cpf || '-'}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold">0</p>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-primary">R$ 0,00</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '-'}
                      </p>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-500">
                        <span className="w-2 h-2 rounded-full bg-current" />
                        Ativo
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          className="p-2 hover:bg-secondary rounded-lg transition-colors"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          className="p-2 hover:bg-secondary rounded-lg transition-colors"
                          title="Bloquear"
                        >
                          🚫
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {total > 50 && (
          <div className="p-4 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {Math.min(50, total)} de {total} usuários
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-1 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                Anterior
              </button>
              <button className="px-3 py-1 rounded-lg bg-primary text-primary-foreground">
                1
              </button>
              <button className="px-3 py-1 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                2
              </button>
              <button className="px-3 py-1 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
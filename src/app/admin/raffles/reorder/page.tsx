import RaffleReorder from '@/components/admin/RaffleReorder'
import Link from 'next/link'

export default function ReorderRafflesPage() {
  return (
    <div>
      <div className="mb-6">
        <Link 
          href="/admin/raffles"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Voltar para Rifas
        </Link>
      </div>
      
      <RaffleReorder />
    </div>
  )
}
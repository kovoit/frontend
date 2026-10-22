import { useState } from 'react'
import { MdDownload } from 'react-icons/md'
import { getBlob, toApiError } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { auditParams } from '../api'
import type { AuditFilters } from '../types'

/** Export CSV des événements filtrés (10 000 lignes au plus ; l'export est journalisé). */
export function ExportButton({ filters }: { filters: AuditFilters }) {
  const [state, setState] = useState<{ busy: boolean; error: string | null }>({
    busy: false,
    error: null,
  })

  const exporter = async () => {
    setState({ busy: true, error: null })
    try {
      const query = new URLSearchParams(auditParams(filters)).toString()
      const blob = await getBlob(`/admin/audit/export/${query ? `?${query}` : ''}`)
      const url = URL.createObjectURL(blob)
      const lien = document.createElement('a')
      lien.href = url
      lien.download = `journal-audit-${new Date().toISOString().slice(0, 10)}.csv`
      lien.click()
      URL.revokeObjectURL(url)
      setState({ busy: false, error: null })
    } catch (error) {
      setState({ busy: false, error: toApiError(error).message })
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="secondary" onClick={() => void exporter()} disabled={state.busy}>
        <MdDownload aria-hidden className="h-4 w-4" />
        {state.busy ? 'Export…' : 'Exporter (CSV)'}
      </Button>
      {state.error && (
        <p role="alert" className="text-xs text-danger-700 dark:text-danger-100">
          {state.error}
        </p>
      )}
    </div>
  )
}

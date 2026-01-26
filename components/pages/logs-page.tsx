'use client'

import { useState, useEffect } from 'react'
import { type MaterialLog } from '@/lib/types'
import { getInventoryHistory } from '@/lib/storage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function LogsPage() {
  const [logs, setLogs] = useState<MaterialLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true)
      const history = await getInventoryHistory()
      setLogs(history)
      setLoading(false)
    }
    fetchLogs()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Material Logs</h1>
        <p className="text-muted-foreground mt-2">Track all material usage and inventory deductions</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading logs...</p>
          ) : logs.length === 0 ? (
            <p className="text-muted-foreground">No material logs recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-start p-3 border border-border rounded-md">
                  <div>
                    <p className="text-sm font-medium text-foreground">Material: {log.materialName || log.materialId}</p>
                    <p className="text-xs text-muted-foreground">Used by: {log.usedBy}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{log.quantity} used</p>
                    <p className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

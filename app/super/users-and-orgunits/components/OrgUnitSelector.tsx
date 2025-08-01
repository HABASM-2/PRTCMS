'use client'

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import OrgUnitTreeSelectorModal from "./OrgUnitTreeSelectorModal"
import OrgUnitTreeSelector from "./OrgUnitTreeSelector"

interface Props {
  userId: number
  organisationId?: number // optional for fallback case
  onChange: (selected: number[]) => void
}

export default function OrgUnitSelector({
  userId,
  organisationId,
  onChange,
}: Props) {
  const [orgUnitTree, setOrgUnitTree] = useState<any[]>([])
  const [selectedOrgUnitIds, setSelectedOrgUnitIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadOrgUnits = async () => {
      setLoading(true)
      setOrgUnitTree([])
      setSelectedOrgUnitIds([])

      const url = organisationId
        ? `/api/orgunits/org-units?id=${organisationId}&userId=${userId}`
        : `/api/orgunits/all-for-user?id=${userId}`

      try {
        const res = await fetch(url)
        const data = await res.json()
        setOrgUnitTree(data.tree || [])
        setSelectedOrgUnitIds(data.assignedOrgUnitIds || [])
        onChange(data.assignedOrgUnitIds || [])
      } catch (err) {
        console.error("Failed to load organisation units", err)
      } finally {
        setLoading(false)
      }
    }

    if (userId) loadOrgUnits()
  }, [userId, organisationId, onChange])

  if (loading) {
    return (
      <div className="flex items-center text-muted-foreground text-sm">
        <Loader2 className="animate-spin w-4 h-4 mr-2" />
        Loading organisation units...
      </div>
    )
  }

  return organisationId ? (
    <OrgUnitTreeSelectorModal
      userId={userId}
      organisationId={organisationId}
      onChange={(ids) => {
        setSelectedOrgUnitIds(ids)
        onChange(ids)
      }}
    />
  ) : (
    <OrgUnitTreeSelector
      tree={orgUnitTree}
      selectedIds={selectedOrgUnitIds}
      onChange={(ids) => {
        setSelectedOrgUnitIds(ids)
        onChange(ids)
      }}
    />
  )
}

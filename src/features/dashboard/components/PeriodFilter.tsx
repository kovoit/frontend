import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { PERIODES, type Periode } from '../types'

type PeriodFilterProps = {
  value: Periode
  onChange: (periode: Periode) => void
}

const OPTIONS = (Object.keys(PERIODES) as Periode[]).map((code) => ({
  value: code,
  label: PERIODES[code],
}))

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  return <SegmentedControl label="Période" options={OPTIONS} value={value} onChange={onChange} />
}

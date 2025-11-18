import { Chip } from '@mui/material';
import { SpecificationStatus } from '@common/enums';

interface StatusBadgeProps {
  status: SpecificationStatus;
}

const STATUS_CONFIG = {
  [SpecificationStatus.DRAFT]: {
    label: '編集中',
    color: 'default' as const,
  },
  [SpecificationStatus.SAVED]: {
    label: '保存済み',
    color: 'success' as const,
  },
  [SpecificationStatus.ARCHIVED]: {
    label: 'アーカイブ',
    color: 'default' as const,
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
    />
  );
}

import { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';
import type { SpecificationListItem } from '../../types/dto';

interface SpecificationListProps {
  specifications: SpecificationListItem[];
  onDelete: (id: string) => void;
  onExport: (id: string, format: 'pdf' | 'word' | 'markdown') => void;
}

export function SpecificationList({
  specifications,
  onDelete,
  onExport,
}: SpecificationListProps) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSpec, setSelectedSpec] = useState<string | null>(null);

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    specId: string
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedSpec(specId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSpec(null);
  };

  const handleEdit = () => {
    if (selectedSpec) {
      navigate(`/specifications/${selectedSpec}/edit`);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedSpec) {
      onDelete(selectedSpec);
    }
    handleMenuClose();
  };

  const handleExport = (format: 'pdf' | 'word' | 'markdown') => {
    if (selectedSpec) {
      onExport(selectedSpec, format);
    }
    handleMenuClose();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (specifications.length === 0) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          py: 8,
          px: 2,
        }}
      >
        <Typography variant="h6" color="text.secondary">
          仕様書がありません
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          右上の「新規作成」ボタンから仕様書を作成してください
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>件名</TableCell>
              <TableCell>ステータス</TableCell>
              <TableCell>バージョン</TableCell>
              <TableCell>作成者</TableCell>
              <TableCell>更新日</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {specifications.map((spec) => (
              <TableRow
                key={spec.specificationId}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/specifications/${spec.specificationId}/edit`)}
              >
                <TableCell>{spec.title || '（無題）'}</TableCell>
                <TableCell>
                  <StatusBadge status={spec.status} />
                </TableCell>
                <TableCell>{spec.version}</TableCell>
                <TableCell>{spec.authorName}</TableCell>
                <TableCell>{formatDate(spec.updatedAt)}</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuOpen(e, spec.specificationId);
                    }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          編集
        </MenuItem>
        <MenuItem onClick={() => handleExport('pdf')}>
          <DownloadIcon sx={{ mr: 1, fontSize: 20 }} />
          PDF エクスポート
        </MenuItem>
        <MenuItem onClick={() => handleExport('word')}>
          <DownloadIcon sx={{ mr: 1, fontSize: 20 }} />
          Word エクスポート
        </MenuItem>
        <MenuItem onClick={() => handleExport('markdown')}>
          <DownloadIcon sx={{ mr: 1, fontSize: 20 }} />
          Markdown エクスポート
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          削除
        </MenuItem>
      </Menu>
    </>
  );
}

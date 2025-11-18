import { useEffect, useState } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { SpecificationList } from '../components/dashboard';
import { Loading } from '../components/common';
import { specificationService, schemaService, getErrorMessage } from '../services';
import type { SpecificationListItem } from '../types/dto';

export function DashboardPage() {
  const navigate = useNavigate();
  const [specifications, setSpecifications] = useState<SpecificationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSpecifications();
  }, []);

  const loadSpecifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await specificationService.list();
      setSpecifications(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      // デフォルトスキーマを使用して新規作成
      const schema = await schemaService.getDefault();
      const result = await specificationService.create({
        schemaId: schema.schemaId,
      });
      navigate(`/specifications/${result.specificationId}/edit`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この仕様書を削除してもよろしいですか?')) {
      return;
    }

    try {
      await specificationService.delete(id);
      await loadSpecifications();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleExport = async (id: string, format: 'pdf' | 'word' | 'markdown') => {
    try {
      const blob = await specificationService.export(id, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `specification_${id}.${format === 'word' ? 'docx' : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading) {
    return <Loading message="読み込み中..." />;
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4">仕様書一覧</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          新規作成
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <SpecificationList
        specifications={specifications}
        onDelete={handleDelete}
        onExport={handleExport}
      />
    </Box>
  );
}

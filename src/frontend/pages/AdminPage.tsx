import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Button,
} from '@mui/material';
import { Loading } from '../components/common';
import { schemaService, getErrorMessage } from '../services';
import type { SchemaWithStructure } from '@common/entities';

export function AdminPage() {
  const [schema, setSchema] = useState<SchemaWithStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSchema();
  }, []);

  const loadSchema = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await schemaService.getDefault();
      setSchema(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('デフォルトスキーマにリセットしてもよろしいですか？')) {
      return;
    }

    try {
      await schemaService.reset();
      await loadSchema();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading) {
    return <Loading message="読み込み中..." />;
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!schema) {
    return (
      <Box>
        <Alert severity="error">スキーマが見つかりません</Alert>
      </Box>
    );
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
        <Typography variant="h4">スキーマ管理</Typography>
        <Button variant="outlined" color="warning" onClick={handleReset}>
          デフォルトにリセット
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        現在のバージョンでは、スキーマの表示のみサポートしています。
        編集機能は今後のバージョンで実装予定です。
      </Alert>

      <Typography variant="h6" sx={{ mb: 2 }}>
        {schema.name}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {schema.description}
      </Typography>

      {schema.categories?.map((category) => (
        <Paper key={category.categoryId} sx={{ mb: 3, p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {category.name}
          </Typography>
          {category.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {category.description}
            </Typography>
          )}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>フィールド名</TableCell>
                  <TableCell>データ型</TableCell>
                  <TableCell>必須</TableCell>
                  <TableCell>説明</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {category.fields?.map((field) => (
                  <TableRow key={field.fieldId}>
                    <TableCell>{field.label}</TableCell>
                    <TableCell>
                      <Chip label={field.dataType} size="small" />
                    </TableCell>
                    <TableCell>
                      {field.isRequired ? (
                        <Chip label="必須" color="error" size="small" />
                      ) : (
                        <Chip label="任意" size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>{field.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ))}
    </Box>
  );
}

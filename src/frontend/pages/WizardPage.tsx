import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Alert } from '@mui/material';
import { WizardContainer } from '../components/wizard';
import { Loading } from '../components/common';
import { specificationService, schemaService, getErrorMessage } from '../services';
import type { SchemaWithStructure } from '@common/entities';
import type { FieldValue } from '../types/dto';

export function WizardPage() {
  const { id } = useParams<{ id: string }>();
  const [schema, setSchema] = useState<SchemaWithStructure | null>(null);
  const [initialData, setInitialData] = useState<Record<string, FieldValue>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // スキーマを取得
      const schemaData = await schemaService.getDefault();
      setSchema(schemaData);

      // 編集モードの場合、既存データを取得
      if (id) {
        const spec = await specificationService.get(id);
        setInitialData(spec.content || {});
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: Record<string, FieldValue>) => {
    // タイトルを取得（件名フィールドから）
    const title = (data['subject'] as string) || '（無題）';

    if (id) {
      // 更新
      await specificationService.update(id, { title, data });
    } else {
      // 新規作成の場合は既にIDが発行されているはず
      throw new Error('Specification ID not found');
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
      <Typography variant="h4" sx={{ mb: 3 }}>
        {id ? '仕様書編集' : '新規仕様書作成'}
      </Typography>

      <WizardContainer
        specificationId={id || null}
        schema={schema}
        initialData={initialData}
        onSave={handleSave}
      />
    </Box>
  );
}

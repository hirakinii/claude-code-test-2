/**
 * ウィザードコンテナ
 * ステップ形式での仕様書作成をサポート
 */
import { useState } from 'react';
import { Box, Paper, Button, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { StepProgress } from './StepProgress';
import { DynamicField } from './DynamicField';
import { useAutoSave } from '../../hooks';
import { validateRequiredFields } from '../../utils';
import type { SchemaWithStructure } from '@common/entities';
import type { FieldValue } from '../../types/dto';

interface WizardContainerProps {
  specificationId: string | null;
  schema: SchemaWithStructure;
  initialData?: Record<string, FieldValue>;
  onSave: (data: Record<string, FieldValue>) => Promise<void>;
}

export function WizardContainer({
  specificationId,
  schema,
  initialData = {},
  onSave,
}: WizardContainerProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<Record<string, FieldValue>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { isSaving, lastSaved } = useAutoSave(specificationId, data);

  const categories = schema.categories || [];
  const currentCategory = categories[currentStep];
  const fields = currentCategory?.fields || [];

  const handleFieldChange = (fieldId: string, value: FieldValue) => {
    setData((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldId];
      return newErrors;
    });
  };

  const handleNext = () => {
    // 現在のステップのバリデーション
    const validation = validateRequiredFields(fields, data);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    if (currentStep < categories.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    // 全フィールドのバリデーション
    const allFields = categories.flatMap((cat) => cat.fields || []);
    const validation = validateRequiredFields(allFields, data);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setSaving(true);
      await onSave(data);
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!currentCategory) {
    return <Alert severity="error">スキーマが正しく読み込まれませんでした</Alert>;
  }

  return (
    <Box>
      <StepProgress
        steps={categories.map((cat) => cat.name)}
        currentStep={currentStep}
      />

      <Paper sx={{ p: 4, mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {fields.map((field) => (
            <DynamicField
              key={field.fieldId}
              field={field}
              value={data[field.fieldId] || null}
              onChange={(value) => handleFieldChange(field.fieldId, value)}
              error={errors[field.fieldId]}
            />
          ))}
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          {isSaving && <Alert severity="info">自動保存中...</Alert>}
          {lastSaved && !isSaving && (
            <Alert severity="success">
              最終保存: {lastSaved.toLocaleTimeString()}
            </Alert>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            戻る
          </Button>

          {currentStep < categories.length - 1 ? (
            <Button variant="contained" onClick={handleNext}>
              次へ
            </Button>
          ) : (
            <Button variant="contained" onClick={handleSave} loading={saving}>
              保存
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}

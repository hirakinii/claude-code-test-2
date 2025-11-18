/**
 * 動的フィールドコンポーネント
 * スキーマ定義に基づいて適切な入力コンポーネントを表示
 */
import { Box, FormControl, FormLabel, FormHelperText } from '@mui/material';
import { Input, TextArea } from '../common';
import type { SchemaField } from '@common/entities';
import { FieldDataType } from '@common/enums';
import type { FieldValue } from '../../types/dto';

interface DynamicFieldProps {
  field: SchemaField;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
  error?: string;
}

export function DynamicField({
  field,
  value,
  onChange,
  error,
}: DynamicFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  // データ型に応じた入力コンポーネントをレンダリング
  switch (field.dataType) {
    case FieldDataType.TEXT:
      return (
        <Input
          label={field.label}
          value={(value as string) || ''}
          onChange={handleChange}
          required={field.isRequired}
          error={!!error}
          helperText={error || field.description || ''}
          fullWidth
        />
      );

    case FieldDataType.TEXTAREA:
      return (
        <TextArea
          label={field.label}
          value={(value as string) || ''}
          onChange={handleChange}
          required={field.isRequired}
          error={!!error}
          helperText={error || field.description || ''}
          rows={4}
        />
      );

    case FieldDataType.NUMBER:
      return (
        <Input
          label={field.label}
          type="number"
          value={(value as number) || ''}
          onChange={(e) => onChange(Number(e.target.value))}
          required={field.isRequired}
          error={!!error}
          helperText={error || field.description || ''}
          fullWidth
        />
      );

    case FieldDataType.DATE:
      return (
        <Input
          label={field.label}
          type="date"
          value={(value as string) || ''}
          onChange={handleChange}
          required={field.isRequired}
          error={!!error}
          helperText={error || field.description || ''}
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
      );

    case FieldDataType.LIST:
      // LIST型は複雑なので、プレースホルダーのみ実装
      return (
        <Box>
          <FormControl fullWidth error={!!error}>
            <FormLabel>{field.label}</FormLabel>
            <Box sx={{ p: 2, border: '1px dashed grey', borderRadius: 1, mt: 1 }}>
              リスト入力（未実装）
            </Box>
            {error && <FormHelperText>{error}</FormHelperText>}
          </FormControl>
        </Box>
      );

    default:
      return (
        <Input
          label={field.label}
          value={(value as string) || ''}
          onChange={handleChange}
          required={field.isRequired}
          error={!!error}
          helperText={error || field.description || ''}
          fullWidth
        />
      );
  }
}

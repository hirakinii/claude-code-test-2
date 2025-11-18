import {
  TextField,
  TextFieldProps,
  FormControl,
  FormLabel,
  FormHelperText,
} from '@mui/material';
import { forwardRef } from 'react';

export interface InputProps extends Omit<TextFieldProps, 'variant'> {
  label?: string;
  helperText?: string;
  error?: boolean;
  variant?: 'outlined' | 'filled' | 'standard';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, variant = 'outlined', ...props }, ref) => {
    return (
      <TextField
        ref={ref}
        label={label}
        helperText={helperText}
        error={error}
        variant={variant}
        fullWidth
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export interface TextAreaProps extends Omit<TextFieldProps, 'variant' | 'multiline'> {
  label?: string;
  helperText?: string;
  error?: boolean;
  rows?: number;
  minRows?: number;
  maxRows?: number;
}

export const TextArea = forwardRef<HTMLInputElement, TextAreaProps>(
  ({ label, helperText, error, rows = 4, minRows, maxRows, ...props }, ref) => {
    return (
      <TextField
        ref={ref}
        label={label}
        helperText={helperText}
        error={error}
        multiline
        rows={rows}
        minRows={minRows}
        maxRows={maxRows}
        variant="outlined"
        fullWidth
        {...props}
      />
    );
  }
);

TextArea.displayName = 'TextArea';

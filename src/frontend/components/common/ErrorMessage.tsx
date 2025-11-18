import { Alert, AlertTitle } from '@mui/material';

export interface ErrorMessageProps {
  title?: string;
  message: string;
  onClose?: () => void;
}

export function ErrorMessage({ title = 'エラー', message, onClose }: ErrorMessageProps) {
  return (
    <Alert severity="error" onClose={onClose}>
      {title && <AlertTitle>{title}</AlertTitle>}
      {message}
    </Alert>
  );
}

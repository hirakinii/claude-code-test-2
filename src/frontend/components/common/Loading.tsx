import { Box, CircularProgress, Typography } from '@mui/material';

export interface LoadingProps {
  message?: string;
  size?: number;
  fullScreen?: boolean;
}

export function Loading({ message, size = 40, fullScreen = false }: LoadingProps) {
  const content = (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={2}
    >
      <CircularProgress size={size} />
      {message && <Typography variant="body2">{message}</Typography>}
    </Box>
  );

  if (fullScreen) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
      >
        {content}
      </Box>
    );
  }

  return content;
}

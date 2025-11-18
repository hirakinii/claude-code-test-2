import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
      }}
    >
      <Typography variant="h1">404</Typography>
      <Typography variant="h5">ページが見つかりません</Typography>
      <Button variant="contained" onClick={() => navigate('/dashboard')}>
        ダッシュボードに戻る
      </Button>
    </Box>
  );
}

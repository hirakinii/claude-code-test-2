import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';

export function Layout() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* TODO: Add Header and Sidebar */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
}

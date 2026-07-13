import * as React from 'react';
import { styled } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import MuiDrawer, { drawerClasses } from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import MenuContent from './MenuContent';
import OptionsMenu from './OptionsMenu';
import { useAuth } from '../../auth/AuthContext';

const expandedWidth = 240;
const collapsedWidth = 72;

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'collapsed' })<{
  collapsed?: boolean;
}>(({ collapsed }) => ({
  width: collapsed ? collapsedWidth : expandedWidth,
  flexShrink: 0,
  boxSizing: 'border-box',
  transition: 'width 0.2s ease',
  [`& .${drawerClasses.paper}`]: {
    width: collapsed ? collapsedWidth : expandedWidth,
    boxSizing: 'border-box',
    transition: 'width 0.2s ease',
    overflowX: 'hidden',
  },
}));

export default function SideMenu() {
  const [collapsed, setCollapsed] = React.useState(false);
  const { user } = useAuth();

  return (
    <Drawer
      variant="permanent"
      collapsed={collapsed}
      sx={{
        display: { xs: 'none', md: 'block' },
        [`& .${drawerClasses.paper}`]: {
          backgroundColor: 'background.paper',
        },
      }}
    >
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          mt: 'calc(var(--template-frame-height, 0px) + 4px)',
          p: 1.5,
        }}
      >
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1, minWidth: 0 }}>
          <Avatar
            variant="rounded"
            sx={{
              width: 36,
              height: 36,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              fontWeight: 700,
              fontSize: '1rem',
            }}
          >
            P
          </Avatar>
          {!collapsed && (
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }} noWrap>
                PharmaCo ERP
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                Web app
              </Typography>
            </Box>
          )}
        </Stack>
        {!collapsed && (
          <IconButton
            size="small"
            onClick={() => setCollapsed(true)}
            sx={{
              border: 'none',
              bgcolor: 'transparent',
              '&:hover': { bgcolor: 'action.hover', borderColor: 'transparent' },
            }}
          >
            <ChevronLeftRoundedIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>
      <Divider />
      {collapsed && (
        <Stack sx={{ alignItems: 'center', py: 1 }}>
          <IconButton
            size="small"
            onClick={() => setCollapsed(false)}
            sx={{
              border: 'none',
              bgcolor: 'transparent',
              color: 'text.secondary',
              '&:hover': { bgcolor: 'action.hover', borderColor: 'transparent' },
            }}
          >
            <ChevronRightRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
      )}
      <Box
        sx={{
          overflow: 'auto',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <MenuContent collapsed={collapsed} />
      </Box>
      <Stack
        direction="row"
        sx={{
          p: collapsed ? 1 : 2,
          gap: 1,
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Avatar sizes="small" alt={user?.name} sx={{ width: 36, height: 36 }}>
          {user?.name?.[0]}
        </Avatar>
        {!collapsed && (
          <>
            <Box sx={{ mr: 'auto', minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: '16px' }} noWrap>
                {user?.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                {user?.email}
              </Typography>
            </Box>
            <OptionsMenu />
          </>
        )}
      </Stack>
    </Drawer>
  );
}

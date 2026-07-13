import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import { useActionItems } from '../useActionItems';

export default function NotificationsMenu() {
  const navigate = useNavigate();
  const { openItems, totalOpen } = useActionItems();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const close = () => setAnchor(null);

  return (
    <>
      <Badge
        color="error"
        badgeContent={totalOpen}
        max={99}
        overlap="circular"
        sx={{ '& .MuiBadge-badge': { right: 4, top: 4 } }}
      >
        <IconButton
          size="small"
          aria-label="Open notifications"
          onClick={(e) => setAnchor(e.currentTarget)}
        >
          <NotificationsRoundedIcon />
        </IconButton>
      </Badge>
      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 360, maxWidth: '100%' } } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2">Notifications</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {totalOpen > 0 ? `${totalOpen} item${totalOpen === 1 ? '' : 's'} need attention` : "You're all caught up"}
          </Typography>
        </Box>
        <Divider />
        {openItems.length === 0 ? (
          <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
            <CheckCircleOutlineRoundedIcon sx={{ fontSize: 32, color: 'success.main', mb: 0.5 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Nothing needs action right now.
            </Typography>
          </Box>
        ) : (
          openItems.map((item) => (
            <MenuItem
              key={item.label}
              onClick={() => {
                close();
                navigate(item.path);
              }}
              sx={{ whiteSpace: 'normal', py: 1.25 }}
            >
              <ListItemIcon sx={{ color: item.moduleColor }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                secondary={item.helper}
                slotProps={{ primary: { sx: { fontWeight: 500 } } }}
              />
              <Chip
                size="small"
                label={item.count}
                sx={{ ml: 1, bgcolor: item.moduleColor, color: '#fff', fontWeight: 700, minWidth: 32 }}
              />
            </MenuItem>
          ))
        )}
        <Divider />
        <MenuItem
          onClick={() => {
            close();
            navigate('/');
          }}
          sx={{ justifyContent: 'center', color: 'primary.main', fontWeight: 500 }}
        >
          View all in Action Center
        </MenuItem>
      </Menu>
    </>
  );
}

import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import AddShoppingCartRoundedIcon from '@mui/icons-material/AddShoppingCartRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import PostAddRoundedIcon from '@mui/icons-material/PostAddRounded';
import PageHeader from '../../procurement/components/PageHeader';
import { useActionItems } from '../useActionItems';

// A single cross-module "what needs you today" list, replacing three separate dashboards
// as the landing page. Each item is a real filter already used on its own module's
// dashboard — this just pools them so nobody has to know which dashboard to check.
export default function ActionCenter() {
  const navigate = useNavigate();
  const { openItems, totalOpen } = useActionItems();

  const moduleLinks = [
    { label: 'Procurement Dashboard', path: '/procurement', color: 'primary.main' as const },
    { label: 'Inventory Dashboard', path: '/inventory', color: 'success.main' as const },
    { label: 'Finance Dashboard', path: '/finance', color: 'warning.main' as const },
  ];

  const startActions = [
    { label: 'Start a Purchase', icon: <AddShoppingCartRoundedIcon />, path: '/procurement/guided-purchase', color: 'primary.main' as const },
    { label: 'Add a Product', icon: <Inventory2RoundedIcon />, path: '/inventory/items/new', color: 'success.main' as const },
    { label: 'Create an Invoice', icon: <PostAddRoundedIcon />, path: '/finance/invoices/new', color: 'warning.main' as const },
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1400px' } }}>
      <PageHeader
        title="Home"
        subtitle="Everything that needs your attention today, across Procurement, Inventory and Finance"
      />

      <Typography component="h2" variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary' }}>
        Start something new
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {startActions.map((a) => (
          <Grid key={a.path} size={{ xs: 12, sm: 4 }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={a.icon}
              onClick={() => navigate(a.path)}
              sx={{ justifyContent: 'flex-start', py: 1.5, bgcolor: a.color, '&:hover': { bgcolor: a.color, filter: 'brightness(0.9)' } }}
            >
              {a.label}
            </Button>
          </Grid>
        ))}
      </Grid>

      <Card variant="outlined" sx={{ mb: 3 }}>
        {openItems.length === 0 ? (
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <CheckCircleOutlineRoundedIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="h6">You're all caught up</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Nothing needs action right now.
            </Typography>
          </CardContent>
        ) : (
          <>
            <CardContent sx={{ pb: 0 }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                {totalOpen} open item{totalOpen === 1 ? '' : 's'} waiting on you
              </Typography>
            </CardContent>
            <List dense disablePadding sx={{ mt: 1 }}>
              {openItems.map((item, i) => (
                <Box key={item.label}>
                  <ListItemButton onClick={() => navigate(item.path)} sx={{ py: 1.5 }}>
                    <ListItemIcon sx={{ color: item.moduleColor, minWidth: 40 }}>{item.icon}</ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      secondary={item.helper}
                      slotProps={{ primary: { sx: { fontWeight: 500 } } }}
                    />
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
                      <Chip size="small" label={item.count} sx={{ bgcolor: item.moduleColor, color: '#fff', fontWeight: 700, minWidth: 32 }} />
                      <ArrowForwardRoundedIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                    </Stack>
                  </ListItemButton>
                  {i < openItems.length - 1 && <Divider component="li" />}
                </Box>
              ))}
            </List>
          </>
        )}
      </Card>

      <Typography component="h2" variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary' }}>
        Or go straight to a module
      </Typography>
      <Grid container spacing={2}>
        {moduleLinks.map((m) => (
          <Grid key={m.path} size={{ xs: 12, sm: 4 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate(m.path)}
              sx={{ justifyContent: 'flex-start', py: 1.5, borderColor: m.color, color: m.color }}
            >
              {m.label}
            </Button>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

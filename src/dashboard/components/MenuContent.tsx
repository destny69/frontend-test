import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import PaidRoundedIcon from '@mui/icons-material/PaidRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';

type NavItem = {
  text: string;
  icon: React.ReactNode;
  path?: string;
  exact?: boolean;
  children?: { text: string; path: string; exact?: boolean }[];
};

const mainListItems: NavItem[] = [
  { text: 'Dashboard', icon: <DashboardRoundedIcon />, path: '/', exact: true },
  {
    text: 'Procurement',
    icon: <ShoppingCartRoundedIcon />,
    children: [
      { text: 'Dashboard', path: '/procurement', exact: true },
      { text: 'Vendors', path: '/procurement/vendors' },
      { text: 'Guided Purchase', path: '/procurement/guided-purchase' },
      { text: 'RFQs', path: '/procurement/rfqs' },
      { text: 'Purchase Orders', path: '/procurement/purchase-orders' },
      { text: 'Goods Receipt (GRN)', path: '/procurement/grn' },
    ],
  },
  {
    text: 'Inventory',
    icon: <Inventory2RoundedIcon />,
    children: [
      { text: 'Dashboard', path: '/inventory', exact: true },
      { text: 'Item Master', path: '/inventory/items' },
      { text: 'Warehouses', path: '/inventory/warehouses' },
      { text: 'Stock', path: '/inventory/stock' },
      { text: 'Transfers', path: '/inventory/transfers' },
      { text: 'Stock Adjustment', path: '/inventory/adjustments' },
    ],
  },
  {
    text: 'Billing & Finance',
    icon: <PaidRoundedIcon />,
    children: [
      { text: 'Dashboard', path: '/finance', exact: true },
      { text: 'Customer Invoices', path: '/finance/invoices' },
      { text: 'Credit Notes', path: '/finance/credit-notes' },
      { text: 'Supplier Bills', path: '/finance/bills' },
      { text: 'Debit Notes', path: '/finance/debit-notes' },
      { text: 'Payments', path: '/finance/payments' },
      { text: 'Reports', path: '/finance/reports' },
    ],
  },
];

export default function MenuContent({ collapsed = false }: { collapsed?: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState<Record<string, boolean>>({
    Procurement: location.pathname.startsWith('/procurement'),
    Inventory: location.pathname.startsWith('/inventory'),
    'Billing & Finance': location.pathname.startsWith('/finance'),
  });

  const toggle = (key: string) =>
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const collapsedButtonSx = {
    justifyContent: 'center',
    minHeight: 40,
    width: 40,
    minWidth: 40,
    mx: 'auto',
    borderRadius: 2,
  };

  return (
    <Stack sx={{ flexGrow: 1, p: 1 }}>
      <List dense sx={{ display: 'flex', flexDirection: 'column', gap: collapsed ? 0.5 : 0 }}>
        {mainListItems.map((item) => {
          if (!item.children) {
            return (
              <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                <Tooltip title={collapsed ? item.text : ''} placement="right">
                  <ListItemButton
                    selected={isActive(item.path!, item.exact)}
                    onClick={() => navigate(item.path!)}
                    sx={collapsed ? collapsedButtonSx : { justifyContent: 'flex-start' }}
                  >
                    <ListItemIcon
                      sx={{ minWidth: 0, mr: collapsed ? 0 : 2, justifyContent: 'center', color: 'inherit' }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {!collapsed && <ListItemText primary={item.text} />}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            );
          }

          const isOpen = !collapsed && (open[item.text] ?? false);
          return (
            <React.Fragment key={item.text}>
              <ListItem disablePadding sx={{ display: 'block' }}>
                <Tooltip title={collapsed ? item.text : ''} placement="right">
                  <ListItemButton
                    selected={isOpen}
                    onClick={() => (collapsed ? navigate(item.children![0].path) : toggle(item.text))}
                    sx={collapsed ? collapsedButtonSx : { justifyContent: 'flex-start' }}
                  >
                    <ListItemIcon
                      sx={{ minWidth: 0, mr: collapsed ? 0 : 2, justifyContent: 'center', color: 'inherit' }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {!collapsed && <ListItemText primary={item.text} />}
                    {!collapsed && (isOpen ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />)}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
              {!collapsed && (
                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                  <Box sx={{ pl: 1 }}>
                    <List dense disablePadding>
                      {item.children.map((child) => (
                        <ListItem key={child.text} disablePadding sx={{ display: 'block' }}>
                          <ListItemButton
                            sx={{ pl: 2, borderRadius: 2 }}
                            selected={isActive(child.path, child.exact)}
                            onClick={() => navigate(child.path)}
                          >
                            <ListItemText primary={child.text} />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Collapse>
              )}
            </React.Fragment>
          );
        })}
      </List>
    </Stack>
  );
}

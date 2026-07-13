import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { SvgIconProps } from '@mui/material/SvgIcon';

export interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ReactElement<SvgIconProps>;
  helper?: string;
  delta?: { label: string; trend: 'up' | 'down' | 'flat' };
  color?: 'primary' | 'warning' | 'error' | 'success' | 'info';
  onClick?: () => void;
}

export default function KpiCard({
  title,
  value,
  icon,
  helper,
  delta,
  color = 'primary',
  onClick,
}: KpiCardProps) {
  const deltaColor =
    delta?.trend === 'up' ? 'success' : delta?.trend === 'down' ? 'error' : 'default';

  return (
    <Card
      variant="outlined"
      onClick={onClick}
      sx={{
        height: '100%',
        ...(onClick && { cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }),
      }}
    >
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Stack sx={{ gap: 0.5 }}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
              {title}
            </Typography>
            <Typography variant="h4" component="p">
              {value}
            </Typography>
            {helper && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {helper}
              </Typography>
            )}
          </Stack>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '10px',
              bgcolor: (theme) =>
                theme.palette.mode === 'light'
                  ? `${theme.palette[color].main}1a`
                  : `${theme.palette[color].dark}33`,
              color: `${color}.main`,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        </Stack>
        {delta && (
          <Chip
            size="small"
            color={deltaColor as any}
            label={delta.label}
            sx={{ mt: 1.5 }}
          />
        )}
      </CardContent>
    </Card>
  );
}

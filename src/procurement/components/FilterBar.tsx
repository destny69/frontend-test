import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';

export default function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <Card variant="outlined" sx={{ p: 1.5, mb: 2 }}>
      <Stack direction="row" sx={{ gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        {children}
      </Stack>
    </Card>
  );
}

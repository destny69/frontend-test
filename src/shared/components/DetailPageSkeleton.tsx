import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

// Generic placeholder for detail/profile pages while their store's initial fetch is
// still in flight — used instead of falling straight to a false "not found" state,
// which otherwise flashes for any record whose id isn't in the pre-fetch mock seed.
export default function DetailPageSkeleton() {
  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Skeleton variant="text" width={220} height={40} />
          <Skeleton variant="text" width={160} height={24} />
        </Box>
        <Skeleton variant="rounded" width={100} height={36} />
      </Stack>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card variant="outlined">
            <CardContent>
              <Skeleton variant="text" width={140} sx={{ mb: 1 }} />
              <Grid container spacing={2}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Grid key={i} size={{ xs: 6, sm: 4 }}>
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="80%" height={28} />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Skeleton variant="text" width={100} sx={{ mb: 1 }} />
              <Skeleton variant="rounded" width={100} height={24} sx={{ mb: 2 }} />
              <Skeleton variant="text" width="90%" />
              <Skeleton variant="text" width="70%" />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Card variant="outlined" sx={{ mt: 2 }}>
        <CardContent>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="text" sx={{ my: 1 }} />
          ))}
        </CardContent>
      </Card>
    </Box>
  );
}

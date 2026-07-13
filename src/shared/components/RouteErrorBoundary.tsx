import { Component, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// Catches a crash in whichever page is currently rendered so it doesn't take
// down the entire app (sidebar/navbar survive) - resets automatically on the
// next navigation since the key changes per route in Dashboard.tsx.
export default class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('Page crashed:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <Box sx={{ width: '100%', maxWidth: 700, mt: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            This page hit an unexpected error and couldn't render.
          </Alert>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, fontFamily: 'monospace' }}>
            {this.state.error.message}
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

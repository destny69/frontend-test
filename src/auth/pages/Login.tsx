import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Link from '@mui/material/Link';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import { useAuth, DEMO_USER } from '../AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, login, loginDemo } = useAuth();
  const [email, setEmail] = useState(DEMO_USER.email);
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!email.trim() || !password.trim()) return;
    setSubmitting(true);
    setError('');
    const result = await login(email, password);
    setSubmitting(false);
    if (result.ok) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  const handleDemo = async () => {
    setSubmitting(true);
    setError('');
    const result = await loginDemo();
    setSubmitting(false);
    if (result.ok) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: (theme) => (theme.palette.mode === 'light' ? '#eef1f8' : 'background.default'),
        p: 2,
      }}
    >
      <Card variant="outlined" sx={{ width: '100%', maxWidth: 440, p: { xs: 3, sm: 5 }, borderRadius: 3 }}>
        <Stack sx={{ alignItems: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: 3,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <StorefrontRoundedIcon sx={{ fontSize: 34 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            PharmaCo Admin
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Sign in to manage your business
          </Typography>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Stack spacing={2}>
          <TextField
            label="Email"
            required
            fullWidth
            error={submitted && !email.trim()}
            helperText={submitted && !email.trim() ? 'Email is required' : undefined}
            sx={{ '& .MuiInputLabel-asterisk': { color: 'error.main' } }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <MailOutlineRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            label="Password"
            required
            fullWidth
            error={submitted && !password.trim()}
            helperText={submitted && !password.trim() ? 'Password is required' : undefined}
            sx={{ '& .MuiInputLabel-asterisk': { color: 'error.main' } }}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPassword((v) => !v)} edge="end">
                      {showPassword ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <FormControlLabel
              control={<Checkbox size="small" checked={remember} onChange={(e) => setRemember(e.target.checked)} />}
              label={<Typography variant="body2">Remember me</Typography>}
            />
            <Link component="button" variant="body2" onClick={(e) => e.preventDefault()}>
              Forgot password?
            </Link>
          </Stack>

          <Button variant="contained" size="large" fullWidth onClick={handleSubmit} disabled={submitting} loading={submitting}>
            Sign In
          </Button>

          <Divider sx={{ my: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              or
            </Typography>
          </Divider>

          <Button
            variant="outlined"
            size="large"
            fullWidth
            onClick={handleDemo}
            disabled={submitting}
            loading={submitting}
            sx={{ bgcolor: 'action.hover' }}
          >
            Try the demo
          </Button>
          <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center' }}>
            Logs you straight in as the demo account — no password needed.
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled', textAlign: 'center' }}>
            Demo: {DEMO_USER.email}
          </Typography>
        </Stack>
      </Card>
    </Box>
  );
}

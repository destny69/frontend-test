import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import FormHelperText from '@mui/material/FormHelperText';
import OutlinedInput, { OutlinedInputProps } from '@mui/material/OutlinedInput';

export interface FormFieldProps extends Omit<OutlinedInputProps, 'id' | 'label'> {
  label: string;
  id?: string;
  helperText?: string;
}

export default function FormField({ label, id, fullWidth, required, error, helperText, ...rest }: FormFieldProps) {
  const inputId = id ?? `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <FormControl fullWidth={fullWidth} size="small" required={required} error={error}>
      <FormLabel htmlFor={inputId} sx={{ '& .MuiFormLabel-asterisk': { color: 'error.main' } }}>{label}</FormLabel>
      <OutlinedInput id={inputId} size="small" required={required} error={error} {...rest} />
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
}

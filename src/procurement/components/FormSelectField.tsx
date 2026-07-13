import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Select, { SelectProps } from '@mui/material/Select';

export interface FormSelectFieldProps extends Omit<SelectProps<string>, 'id' | 'label'> {
  label: string;
  id?: string;
  helperText?: string;
}

export default function FormSelectField({
  label,
  id,
  fullWidth,
  required,
  error,
  helperText,
  children,
  ...rest
}: FormSelectFieldProps) {
  const inputId = id ?? `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <FormControl fullWidth={fullWidth} size="small" required={required} error={error}>
      <FormLabel htmlFor={inputId} sx={{ '& .MuiFormLabel-asterisk': { color: 'error.main' } }}>{label}</FormLabel>
      <Select id={inputId} size="small" required={required} error={error} {...rest}>
        {children}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
}

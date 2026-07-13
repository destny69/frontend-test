import Select, { SelectProps } from '@mui/material/Select';

export default function FilterSelect(props: SelectProps<string>) {
  return <Select size="small" {...props} />;
}

import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

export interface DetailTabItem {
  label: string;
  content: React.ReactNode;
}

export interface DetailTabsProps {
  tabs: DetailTabItem[];
  // Optional external control, so a caller can e.g. jump to a specific tab from a
  // banner button. Uncontrolled (internal state) when omitted.
  activeTab?: number;
  onTabChange?: (index: number) => void;
}

export default function DetailTabs({ tabs, activeTab, onTabChange }: DetailTabsProps) {
  const [internalValue, setInternalValue] = React.useState(0);
  const value = activeTab ?? internalValue;

  const handleChange = (_: React.SyntheticEvent, v: number) => {
    setInternalValue(v);
    onTabChange?.(v);
  };

  return (
    <Box>
      <Tabs
        value={value}
        onChange={handleChange}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
      >
        {tabs.map((tab, i) => (
          <Tab key={i} label={tab.label} />
        ))}
      </Tabs>
      {tabs[value].content}
    </Box>
  );
}

import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

export interface DetailTabItem {
  label: string;
  content: React.ReactNode;
}

export default function DetailTabs({ tabs }: { tabs: DetailTabItem[] }) {
  const [value, setValue] = React.useState(0);

  return (
    <Box>
      <Tabs
        value={value}
        onChange={(_, v) => setValue(v)}
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

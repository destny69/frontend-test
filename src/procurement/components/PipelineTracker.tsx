import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { useNavigate } from 'react-router-dom';

export type PipelineStage = 'requisition' | 'rfq' | 'po' | 'grn' | 'stock';

const STAGES: { key: PipelineStage; label: string }[] = [
  { key: 'requisition', label: 'Requisition' },
  { key: 'rfq', label: 'RFQ' },
  { key: 'po', label: 'Purchase Order' },
  { key: 'grn', label: 'Goods Receipt' },
  { key: 'stock', label: 'Stock' },
];

export interface PipelineTrackerProps {
  current: PipelineStage;
  requisitionId?: string;
  rfqId?: string;
  poId?: string;
  grnId?: string;
  stockId?: string;
}

const PATHS: Record<PipelineStage, (id: string) => string> = {
  requisition: (id) => `/procurement/requisitions/${id}`,
  rfq: (id) => `/procurement/rfqs/${id}`,
  po: (id) => `/procurement/purchase-orders/${id}`,
  grn: (id) => `/procurement/grn/${id}`,
  stock: (id) => `/inventory/stock/${id}`,
};

// Shows where a document sits in the Requisition -> RFQ -> PO -> GRN -> Stock chain, so
// leaving the Guided Purchase wizard doesn't mean losing all sense of "what's next" —
// every node whose id we've been able to resolve is a live link, not just a label.
export default function PipelineTracker({ current, requisitionId, rfqId, poId, grnId, stockId }: PipelineTrackerProps) {
  const navigate = useNavigate();
  const ids: Record<PipelineStage, string | undefined> = {
    requisition: requisitionId,
    rfq: rfqId,
    po: poId,
    grn: grnId,
    stock: stockId,
  };
  const currentIndex = STAGES.findIndex((s) => s.key === current);

  return (
    <Card variant="outlined" sx={{ mb: 2, px: 2, py: 1.5 }}>
      <Stack direction="row" sx={{ alignItems: 'center' }}>
        {STAGES.map((stage, i) => {
          const isCurrent = stage.key === current;
          const isPast = i < currentIndex;
          const id = ids[stage.key];
          const clickable = !isCurrent && !!id;

          const node = (
            <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: 12,
                  fontWeight: 700,
                  bgcolor: isCurrent ? 'primary.main' : isPast ? 'success.main' : 'action.disabledBackground',
                  color: isCurrent || isPast ? 'primary.contrastText' : 'text.disabled',
                }}
              >
                {isPast ? <CheckRoundedIcon sx={{ fontSize: 14 }} /> : i + 1}
              </Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent ? 'text.primary' : id ? 'text.secondary' : 'text.disabled',
                  whiteSpace: 'nowrap',
                }}
              >
                {stage.label}
              </Typography>
            </Stack>
          );

          return (
            <Box key={stage.key} sx={{ display: 'flex', alignItems: 'center', flex: i === STAGES.length - 1 ? '0 0 auto' : 1 }}>
              {clickable ? (
                <ButtonBase
                  onClick={() => navigate(PATHS[stage.key](id!))}
                  sx={{ borderRadius: 1, px: 0.5, py: 0.25, '&:hover': { bgcolor: 'action.hover' } }}
                >
                  {node}
                </ButtonBase>
              ) : (
                <Box sx={{ px: 0.5, py: 0.25, opacity: isCurrent ? 1 : id ? 1 : 0.6 }}>{node}</Box>
              )}
              {i < STAGES.length - 1 && (
                <Box
                  sx={{
                    flex: 1,
                    height: 2,
                    mx: 1,
                    bgcolor: i < currentIndex ? 'success.main' : 'action.disabledBackground',
                    borderRadius: 1,
                  }}
                />
              )}
            </Box>
          );
        })}
      </Stack>
    </Card>
  );
}

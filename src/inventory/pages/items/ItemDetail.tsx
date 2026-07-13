import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded';
import PageHeader from '../../components/PageHeader';
import StatusChip from '../../components/StatusChip';
import DetailTabs from '../../components/DetailTabs';
import { ExpiryChip } from '../../components/expiryUtils';
import Barcode, { printBarcode } from '../../components/Barcode';
import { useInventory } from '../../store/InventoryStore';
import { warehouseById } from '../../data/mockData';
import { orderBatchesByCosting } from '../../data/costing';
import DetailPageSkeleton from '../../../shared/components/DetailPageSkeleton';

function LabeledValue({ label, value }: { label: string; value?: string | number }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{value ?? '—'}</Typography>
    </Box>
  );
}

const COSTING_METHOD_LABEL: Record<string, string> = {
  FEFO: 'FEFO (First-Expired, First-Out)',
  FIFO: 'FIFO (First-In, First-Out)',
};

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading, items, batches } = useInventory();
  const item = items.find((i) => i.id === id);

  if (loading && !item) {
    return <DetailPageSkeleton />;
  }

  if (!item) {
    return (
      <Box>
        <Typography>Product not found.</Typography>
        <Button onClick={() => navigate('/inventory/items')}>Back to list</Button>
      </Box>
    );
  }

  const itemBatches = batches.filter((b) => b.itemId === item.id);
  const totalAvailable = itemBatches.reduce((sum, b) => sum + b.availableQty, 0);
  const totalReserved = itemBatches.reduce((sum, b) => sum + b.reservedQty, 0);
  const stockLevel = totalAvailable === 0 ? 'Out of Stock' : totalAvailable <= item.reorderLevel ? 'Low Stock' : 'In Stock';

  // FEFO/FIFO pick order — the sequence stock would be consumed in.
  const pickOrder = orderBatchesByCosting(
    itemBatches.filter((b) => b.availableQty > 0),
    item.costingMethod,
  );

  // Derived alerts from on-hand vs. thresholds.
  const belowSafety = totalAvailable > 0 && totalAvailable <= item.safetyStock;
  const overstock = item.maximumStock > 0 && totalAvailable >= item.maximumStock;

  const overviewTab = (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Stack spacing={2}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>General Information</Typography>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="SKU" value={item.sku} /></Grid>
                <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Category" value={item.category} /></Grid>
                <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Brand" value={item.brand} /></Grid>
                <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Manufacturer" value={item.manufacturer} /></Grid>
                <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Unit of Measure" value={item.uom} /></Grid>
                <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Stock Type" value={item.stockType} /></Grid>
                <Grid size={{ xs: 12 }}><LabeledValue label="Description" value={item.description} /></Grid>
                <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Storage Condition" value={item.storageCondition} /></Grid>
                <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Shelf Life" value={item.expiryTracking ? `${item.shelfLifeMonths} months` : 'Not tracked'} /></Grid>
                <Grid size={{ xs: 6, sm: 4 }}><LabeledValue label="Costing Method" value={COSTING_METHOD_LABEL[item.costingMethod] ?? item.costingMethod} /></Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="subtitle2" gutterBottom>Barcode</Typography>
                <Button size="small" startIcon={<QrCode2RoundedIcon />} onClick={() => printBarcode({ title: item.name, subtitle: `${item.sku} · ${item.category}`, value: item.barcode || item.sku })}>
                  Print Barcode
                </Button>
              </Stack>
              {item.barcode ? (
                <Barcode value={item.barcode} />
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>No barcode assigned.</Typography>
              )}
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>Pick Order</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Next batch to be consumed appears first.
              </Typography>
              {pickOrder.length === 0 ? (
                <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>No available stock.</Typography>
              ) : (
                <Stack sx={{ mt: 1 }}>
                  {pickOrder.map((b, i) => (
                    <Stack key={b.id} direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', py: 0.75, borderBottom: i < pickOrder.length - 1 ? 1 : 0, borderColor: 'divider' }}>
                      <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
                        {i === 0 && <Chip size="small" color="primary" label="Next" />}
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{b.batchNumber}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{warehouseById(b.warehouseId)?.name}</Typography>
                      </Stack>
                      <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center' }}>
                        <Typography variant="body2">{b.availableQty.toLocaleString()} {item.uom}</Typography>
                        {item.expiryTracking && <ExpiryChip dateStr={b.expiryDate} />}
                      </Stack>
                    </Stack>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>Stock Status</Typography>
            <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', mb: 1 }}>
              <StatusChip status={stockLevel} />
              {belowSafety && <Chip size="small" color="error" label="Below Safety" />}
              {overstock && <Chip size="small" color="warning" label="Overstock" />}
            </Stack>
            <Stack sx={{ mt: 1, gap: 1.5 }}>
              <LabeledValue label="Available" value={totalAvailable.toLocaleString()} />
              <LabeledValue label="Reserved" value={totalReserved.toLocaleString()} />
              <LabeledValue label="Reorder Level" value={item.reorderLevel.toLocaleString()} />
              <LabeledValue label="Safety Stock" value={item.safetyStock.toLocaleString()} />
              <LabeledValue label="Maximum Stock" value={item.maximumStock.toLocaleString()} />
              <LabeledValue label="Preferred Supplier" value={item.preferredSupplier} />
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Shown when this item has never had stock recorded - the two real ways to
  // get some are receiving a PO via GRN, or a manual Stock In for opening
  // balances/found stock (mirrors the empty-state CTA pattern used elsewhere,
  // e.g. BillForm's "no purchase orders yet").
  const noStockState = (
    <Stack sx={{ alignItems: 'center', py: 5, gap: 1.5 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        No stock recorded for this item yet.
      </Typography>
      <Stack direction="row" sx={{ gap: 1.5 }}>
        <Button variant="contained" size="small" onClick={() => navigate(`/inventory/stock/new?item=${item.id}`)}>
          Stock In
        </Button>
        <Button variant="outlined" size="small" onClick={() => navigate(`/procurement/requisitions/new?item=${item.id}`)}>
          Request Materials
        </Button>
      </Stack>
    </Stack>
  );

  const stockTab = (
    <Card variant="outlined">
      {itemBatches.length === 0 ? noStockState : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Warehouse</TableCell>
              <TableCell>Batch</TableCell>
              <TableCell align="right">Available</TableCell>
              <TableCell align="right">Reserved</TableCell>
              <TableCell>Expiry</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {itemBatches.map((b) => (
              <TableRow key={b.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/inventory/stock/${b.id}`)}>
                <TableCell>{warehouseById(b.warehouseId)?.name}</TableCell>
                <TableCell sx={{ fontWeight: 500 }}>{b.batchNumber}</TableCell>
                <TableCell align="right">{b.availableQty.toLocaleString()}</TableCell>
                <TableCell align="right">{b.reservedQty.toLocaleString()}</TableCell>
                <TableCell><ExpiryChip dateStr={b.expiryDate} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );

  const batchesTab = (
    <Card variant="outlined">
      {itemBatches.length === 0 ? noStockState : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Batch Number</TableCell>
              <TableCell>Manufacturing Date</TableCell>
              <TableCell>Expiry Date</TableCell>
              <TableCell align="right">Available Qty</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {itemBatches.map((b) => (
              <TableRow key={b.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/inventory/stock/${b.id}`)}>
                <TableCell sx={{ fontWeight: 500 }}>{b.batchNumber}</TableCell>
                <TableCell>{b.manufacturingDate}</TableCell>
                <TableCell>{b.expiryDate}</TableCell>
                <TableCell align="right">{b.availableQty.toLocaleString()}</TableCell>
                <TableCell><StatusChip status={b.qcStatus} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );

  const purchaseHistoryTab = (
    <Card variant="outlined">
      {itemBatches.length === 0 ? (
        <Stack sx={{ alignItems: 'center', py: 5, gap: 1.5 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            No purchase history for this item yet.
          </Typography>
          <Button variant="outlined" size="small" onClick={() => navigate(`/procurement/requisitions/new?item=${item.id}`)}>
            Request Materials
          </Button>
        </Stack>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>PO Number</TableCell>
              <TableCell>GRN Number</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell align="right">Qty Received</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {itemBatches.map((b) => (
              <TableRow key={b.id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{b.poNumber}</TableCell>
                <TableCell>{b.grnNumber}</TableCell>
                <TableCell>{b.supplierName}</TableCell>
                <TableCell align="right">{b.receivedQty.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <PageHeader
        title={item.name}
        subtitle={`${item.sku} · ${item.category}`}
        actions={
          <>
            <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/inventory/items')}>Back</Button>
            <Button variant="outlined" onClick={() => navigate(`/inventory/ledger?item=${item.id}`)}>
              View in Stock Ledger
            </Button>
          </>
        }
      />
      <DetailTabs
        tabs={[
          { label: 'Overview', content: overviewTab },
          { label: 'Current Stock', content: stockTab },
          { label: 'Batches', content: batchesTab },
          { label: 'Purchase History', content: purchaseHistoryTab },
        ]}
      />
    </Box>
  );
}

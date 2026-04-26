import { useEffect, useMemo, useState } from 'react';
import type { UserRole } from '../../../types/auth';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/api';
import { canAccessModule, canEditModule, canPerformAction, getRoleLabel, MODULE_OPTIONS } from '../permissions';
import { accountingService } from '../../../services/accountingService';
import { MOCK_APPROVAL_RECORDS, MOCK_BAR_RECORD, MOCK_INVENTORY_RECORD, MOCK_RECEPTION_RECORD, MOCK_VIP_RECORD } from '../mockData';
import type {
  AccountingModule,
  ApprovalRecord,
  DepartmentModuleState,
  InventoryModuleState,
  ReceptionModuleState,
  RecordState,
} from '../types';
import { calculateDepartmentTotals, calculateInventoryTotals, calculateReceptionTotals, formatCurrency } from '../utils';
import { debtLedgerService } from '../../../services/debtLedgerService';
import { StatusBadge } from './StatusBadge';
import './AccountingModuleWorkspace.css';

interface AccountingModuleWorkspaceProps {
  module: AccountingModule;
  role: UserRole;
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function shiftDate(dateKey: string, days: number) {
  const next = new Date(dateKey);
  next.setDate(next.getDate() + days);
  return toDateKey(next);
}

function todayKey() {
  return toDateKey(new Date());
}

function createHistoricDepartmentRecord(record: DepartmentModuleState): DepartmentModuleState {
  const yesterday = shiftDate(todayKey(), -1);
  return {
    ...record,
    id: `${record.module}-${yesterday}`,
    date: yesterday,
    status: 'submitted',
  };
}

function createHistoricReceptionRecord(record: ReceptionModuleState): ReceptionModuleState {
  const yesterday = shiftDate(todayKey(), -1);
  return {
    ...record,
    id: `${record.module}-${yesterday}`,
    date: yesterday,
    status: 'submitted',
  };
}

function createHistoricInventoryRecord(record: InventoryModuleState): InventoryModuleState {
  const yesterday = shiftDate(todayKey(), -1);
  return {
    ...record,
    id: `${record.module}-${yesterday}`,
    date: yesterday,
    status: 'submitted',
  };
}

function createNextDailyDepartmentRecord(base: DepartmentModuleState, date: string): DepartmentModuleState {
  return {
    ...base,
    id: `${base.module}-${date}`,
    date,
    status: 'draft',
    debtsExplanation: '',
    transfersSection: 0,
    pos: 0,
    bossCollectedCash: 0,
    rows: base.rows.map((row, index) => ({
      ...row,
      id: `${base.module}-row-${index + 1}-${date}`,
      openingStock: row.closingStock,
      newStock: 0,
      totalStock: row.closingStock,
      closingStock: row.closingStock,
      drinksSold: 0,
      amount: 0,
      damages: 0,
      transfers: 0,
    })),
    warnings: [],
  };
}

function createNextDailyReceptionRecord(base: ReceptionModuleState, date: string): ReceptionModuleState {
  return {
    ...base,
    id: `${base.module}-${date}`,
    date,
    status: 'draft',
    rows: [],
    warnings: [],
  };
}

function createNextDailyInventoryRecord(base: InventoryModuleState, date: string): InventoryModuleState {
  return {
    ...base,
    id: `${base.module}-${date}`,
    date,
    status: 'draft',
    purchases: [],
    transfersToBar: 0,
    transfersToVip: 0,
    flaggedInconsistencies: [],
  };
}

function isLocked(state: RecordState) {
  return state !== 'draft';
}

export function AccountingModuleWorkspace({ module, role }: AccountingModuleWorkspaceProps) {
  const navigate = useNavigate();
  const [approvalRecords, setApprovalRecords] = useState<ApprovalRecord[]>(MOCK_APPROVAL_RECORDS);
  const [vipRecords, setVipRecords] = useState<DepartmentModuleState[]>([
    createHistoricDepartmentRecord(MOCK_VIP_RECORD),
    { ...MOCK_VIP_RECORD, id: `vip-${todayKey()}`, date: todayKey(), status: 'draft' },
  ]);
  const [barRecords, setBarRecords] = useState<DepartmentModuleState[]>([
    createHistoricDepartmentRecord(MOCK_BAR_RECORD),
    { ...MOCK_BAR_RECORD, id: `bar-${todayKey()}`, date: todayKey(), status: 'draft' },
  ]);
  const [receptionRecords, setReceptionRecords] = useState<ReceptionModuleState[]>([
    createHistoricReceptionRecord(MOCK_RECEPTION_RECORD),
    { ...MOCK_RECEPTION_RECORD, id: `reception-${todayKey()}`, date: todayKey(), status: 'draft' },
  ]);
  const [inventoryRecords, setInventoryRecords] = useState<InventoryModuleState[]>([
    createHistoricInventoryRecord(MOCK_INVENTORY_RECORD),
    { ...MOCK_INVENTORY_RECORD, id: `inventory-${todayKey()}`, date: todayKey(), status: 'draft' },
  ]);
  const [selectedVipId, setSelectedVipId] = useState<string>(`vip-${todayKey()}`);
  const [selectedBarId, setSelectedBarId] = useState<string>(`bar-${todayKey()}`);
  const [selectedReceptionId, setSelectedReceptionId] = useState<string>(`reception-${todayKey()}`);
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>(`inventory-${todayKey()}`);
  const [warning, setWarning] = useState<string | null>(null);
  const [, setDebtRefresh] = useState(0);

  useEffect(() => {
    return debtLedgerService.subscribe(() => setDebtRefresh((prev) => prev + 1));
  }, []);

  useEffect(() => {
    void debtLedgerService.refresh();
  }, []);

  const vipRecord = vipRecords.find((record) => record.id === selectedVipId) ?? vipRecords[0];
  const barRecord = barRecords.find((record) => record.id === selectedBarId) ?? barRecords[0];
  const receptionRecord = receptionRecords.find((record) => record.id === selectedReceptionId) ?? receptionRecords[0];
  const inventoryRecord = inventoryRecords.find((record) => record.id === selectedInventoryId) ?? inventoryRecords[0];

  const resolvedStatusFor = (
    baseStatus: RecordState,
    moduleKey: 'vip' | 'bar' | 'reception',
    date: string,
  ): RecordState => {
    if (baseStatus === 'draft') return baseStatus;
    return debtLedgerService.hasAcceptedUnpaidDebt(moduleKey, date) ? 'partially-resolved' : baseStatus;
  };

  const vipDisplayStatus = resolvedStatusFor(vipRecord.status, 'vip', vipRecord.date);
  const barDisplayStatus = resolvedStatusFor(barRecord.status, 'bar', barRecord.date);
  const receptionDisplayStatus = resolvedStatusFor(receptionRecord.status, 'reception', receptionRecord.date);

  const currentRecordStatus = module === 'vip'
    ? vipDisplayStatus
    : module === 'bar'
      ? barDisplayStatus
      : module === 'reception'
        ? receptionDisplayStatus
        : module === 'inventory'
          ? inventoryRecord.status
          : 'reviewed';

  const allowed = canAccessModule(role, module);
  const editable = module === 'approval' ? false : canEditModule(role, module, currentRecordStatus);
  const selectedOption = MODULE_OPTIONS.find((item) => item.module === module);

  const receptionTotals = useMemo(() => calculateReceptionTotals(receptionRecord), [receptionRecord]);
  const inventoryTotals = useMemo(() => calculateInventoryTotals(inventoryRecord), [inventoryRecord]);

  if (!allowed) {
    return (
      <div className="workspace-empty">
        <h2>Access denied</h2>
        <p>You do not have permission to access this module.</p>
        <button onClick={() => navigate(ROUTES.ADMIN_DASHBOARD)}>Back to dashboard</button>
      </div>
    );
  }

  const createDailyRecord = () => {
    const date = todayKey();

    if (module === 'vip') {
      const exists = vipRecords.some((record) => record.date === date);
      if (exists) {
        const current = vipRecords.find((record) => record.date === date);
        if (current) setSelectedVipId(current.id);
        setWarning('A VIP record for today already exists.');
        return;
      }

      const lastRecord = [...vipRecords].sort((a, b) => a.date.localeCompare(b.date)).at(-1) ?? MOCK_VIP_RECORD;
      const next = createNextDailyDepartmentRecord(lastRecord, date);
      setVipRecords((prev) => [...prev, next]);
      setSelectedVipId(next.id);
      setWarning(null);
      return;
    }

    if (module === 'bar') {
      const exists = barRecords.some((record) => record.date === date);
      if (exists) {
        const current = barRecords.find((record) => record.date === date);
        if (current) setSelectedBarId(current.id);
        setWarning('A Bar record for today already exists.');
        return;
      }

      const lastRecord = [...barRecords].sort((a, b) => a.date.localeCompare(b.date)).at(-1) ?? MOCK_BAR_RECORD;
      const next = createNextDailyDepartmentRecord(lastRecord, date);
      setBarRecords((prev) => [...prev, next]);
      setSelectedBarId(next.id);
      setWarning(null);
      return;
    }

    if (module === 'reception') {
      const exists = receptionRecords.some((record) => record.date === date);
      if (exists) {
        const current = receptionRecords.find((record) => record.date === date);
        if (current) setSelectedReceptionId(current.id);
        setWarning('A Reception record for today already exists.');
        return;
      }

      const lastRecord = [...receptionRecords].sort((a, b) => a.date.localeCompare(b.date)).at(-1) ?? MOCK_RECEPTION_RECORD;
      const next = createNextDailyReceptionRecord(lastRecord, date);
      setReceptionRecords((prev) => [...prev, next]);
      setSelectedReceptionId(next.id);
      setWarning(null);
      return;
    }

    if (module === 'inventory') {
      const exists = inventoryRecords.some((record) => record.date === date);
      if (exists) {
        const current = inventoryRecords.find((record) => record.date === date);
        if (current) setSelectedInventoryId(current.id);
        setWarning('An Inventory record for today already exists.');
        return;
      }

      const lastRecord = [...inventoryRecords].sort((a, b) => a.date.localeCompare(b.date)).at(-1) ?? MOCK_INVENTORY_RECORD;
      const next = createNextDailyInventoryRecord(lastRecord, date);
      setInventoryRecords((prev) => [...prev, next]);
      setSelectedInventoryId(next.id);
      setWarning(null);
    }
  };

  const updateDepartmentRow = (index: number, field: keyof DepartmentModuleState['rows'][number], value: string | number) => {
    const updater = module === 'vip' ? setVipRecords : setBarRecords;
    const selectedId = module === 'vip' ? selectedVipId : selectedBarId;
    updater((prev) => prev.map((record) => {
      if (record.id !== selectedId) return record;
      if (isLocked(record.status) && role !== 'boss') return record;
      const rows = record.rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row));
      return { ...record, rows, warnings: [] };
    }));
  };

  const updateReceptionRow = (index: number, field: keyof ReceptionModuleState['rows'][number], value: string | number | boolean) => {
    setReceptionRecords((prev) => prev.map((record) => {
      if (record.id !== selectedReceptionId) return record;
      if (isLocked(record.status) && role !== 'boss') return record;
      const rows = record.rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row));
      return { ...record, rows, warnings: [] };
    }));
  };

  const updateInventoryRow = (index: number, field: keyof InventoryModuleState['purchases'][number], value: string | number) => {
    setInventoryRecords((prev) => prev.map((record) => {
      if (record.id !== selectedInventoryId) return record;
      if (isLocked(record.status) && role !== 'boss') return record;
      const purchases = record.purchases.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row));
      return { ...record, purchases };
    }));
  };

  const addDepartmentRow = () => {
    if (!editable) return;

    const updater = module === 'vip' ? setVipRecords : setBarRecords;
    const selectedId = module === 'vip' ? selectedVipId : selectedBarId;

    updater((prev) => prev.map((record) => {
      if (record.id !== selectedId) return record;
      if (isLocked(record.status) && role !== 'boss') return record;

      const nextIndex = record.rows.length + 1;
      return {
        ...record,
        rows: [
          ...record.rows,
          {
            id: `${record.module}-row-${nextIndex}-${Date.now()}`,
            drinkName: '',
            openingStock: 0,
            newStock: 0,
            totalStock: 0,
            closingStock: 0,
            drinksSold: 0,
            price: 0,
            amount: 0,
            damages: 0,
            transfers: 0,
          },
        ],
      };
    }));
  };

  const removeDepartmentRow = (rowId: string) => {
    if (!editable) return;

    const updater = module === 'vip' ? setVipRecords : setBarRecords;
    const selectedId = module === 'vip' ? selectedVipId : selectedBarId;

    updater((prev) => prev.map((record) => {
      if (record.id !== selectedId) return record;
      if (isLocked(record.status) && role !== 'boss') return record;
      if (record.rows.length <= 1) return record;

      return {
        ...record,
        rows: record.rows.filter((row) => row.id !== rowId),
      };
    }));
  };

  const addReceptionRow = () => {
    if (!editable) return;

    setReceptionRecords((prev) => prev.map((record) => {
      if (record.id !== selectedReceptionId) return record;
      if (isLocked(record.status) && role !== 'boss') return record;

      const nextIndex = record.rows.length + 1;
      return {
        ...record,
        rows: [
          ...record.rows,
          {
            id: `reception-row-${nextIndex}-${Date.now()}`,
            customerName: '',
            sex: 'Other',
            timeIn: '',
            timeOut: '',
            room: '',
            idNumber: '',
            pos: 0,
            transfer: 0,
            cash: 0,
            duration: '',
            roomRate: 0,
            amountPaid: 0,
            existing: false,
          },
        ],
      };
    }));
  };

  const removeReceptionRow = (rowId: string) => {
    if (!editable) return;

    setReceptionRecords((prev) => prev.map((record) => {
      if (record.id !== selectedReceptionId) return record;
      if (isLocked(record.status) && role !== 'boss') return record;

      return {
        ...record,
        rows: record.rows.filter((row) => row.id !== rowId),
      };
    }));
  };

  const addInventoryRow = () => {
    if (!editable) return;

    setInventoryRecords((prev) => prev.map((record) => {
      if (record.id !== selectedInventoryId) return record;
      if (isLocked(record.status) && role !== 'boss') return record;

      const nextIndex = record.purchases.length + 1;
      return {
        ...record,
        purchases: [
          ...record.purchases,
          {
            id: `inventory-row-${nextIndex}-${Date.now()}`,
            itemName: '',
            quantity: 0,
            unitPrice: 0,
            totalCost: 0,
            department: 'Store',
            inconsistency: '',
          },
        ],
      };
    }));
  };

  const removeInventoryRow = (rowId: string) => {
    if (!editable) return;

    setInventoryRecords((prev) => prev.map((record) => {
      if (record.id !== selectedInventoryId) return record;
      if (isLocked(record.status) && role !== 'boss') return record;

      return {
        ...record,
        purchases: record.purchases.filter((row) => row.id !== rowId),
      };
    }));
  };

  const submitCurrent = async () => {
    if (!canPerformAction(role, 'submit')) {
      setWarning('Your role cannot submit this record.');
      return;
    }

    if (module === 'vip') setVipRecords((prev) => prev.map((record) => record.id === selectedVipId ? { ...record, status: 'submitted' } : record));
    if (module === 'bar') setBarRecords((prev) => prev.map((record) => record.id === selectedBarId ? { ...record, status: 'submitted' } : record));
    if (module === 'reception') setReceptionRecords((prev) => prev.map((record) => record.id === selectedReceptionId ? { ...record, status: 'submitted' } : record));
    if (module === 'inventory') setInventoryRecords((prev) => prev.map((record) => record.id === selectedInventoryId ? { ...record, status: 'submitted' } : record));

    try {
      await accountingService.submitRecord(module, module === 'approval' ? 'approval' : (module === 'vip' ? selectedVipId : module === 'bar' ? selectedBarId : module === 'reception' ? selectedReceptionId : selectedInventoryId));
    } catch {
      // offline-friendly UI; backend sync will activate later
    }
  };

  const renderDailyHistory = (
    records: { id: string; date: string; status: DepartmentModuleState['status'] }[],
    selectedId: string,
    onSelect: (id: string) => void,
  ) => {
    const sortedRecords = [...records].sort((a, b) => b.date.localeCompare(a.date));

    return (
      <div className="daily-history">
        <div className="daily-history-header">
          <h3>Daily records</h3>
          <button type="button" onClick={createDailyRecord}>New day record</button>
        </div>
        <div className="daily-history-list">
          {sortedRecords.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={`daily-history-item ${selectedId === entry.id ? 'active' : ''}`}
              onClick={() => onSelect(entry.id)}
            >
              <span>{entry.date}</span>
              <StatusBadge state={entry.status} />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderDepartment = (title: string, record: DepartmentModuleState) => {
    const totals = calculateDepartmentTotals(record);
    const debtExpense = debtLedgerService.getAcceptedUnpaidAmount(record.module, record.date);
    const computedAfterDebt = totals.computedCash - debtExpense;
    const displayStatus = resolvedStatusFor(record.status, record.module, record.date);
    return (
      <div className="workspace-grid">
        <div className="workspace-header-row">
          <div>
            <h2>{title}</h2>
            <p>{selectedOption?.description}</p>
          </div>
          <div className="workspace-meta">
            <StatusBadge state={displayStatus} />
            <span>{getRoleLabel(role)}</span>
          </div>
        </div>

        <div className="workspace-toolbar">
          <div className="toolbar-pill">Editing {editable ? 'enabled' : 'locked'}</div>
          <div className="toolbar-pill">State: {displayStatus}</div>
          <div className="toolbar-pill">Date: {record.date}</div>
        </div>

        {renderDailyHistory(
          (module === 'vip' ? vipRecords : barRecords).map((entry) => ({
            ...entry,
            status: resolvedStatusFor(entry.status, entry.module, entry.date),
          })),
          module === 'vip' ? selectedVipId : selectedBarId,
          module === 'vip' ? setSelectedVipId : setSelectedBarId,
        )}

        <div className="workspace-table-actions">
          <button type="button" onClick={addDepartmentRow} disabled={!editable}>+ Add Drink Row</button>
        </div>

        <div className="workspace-table-wrap">
          <table className="workspace-table">
            <thead>
              <tr>
                <th>Drink name</th>
                <th>Opening stock</th>
                <th>New stock</th>
                <th>Total stock</th>
                <th>Closing stock</th>
                <th>Drinks sold</th>
                <th>Price</th>
                <th>Amount</th>
                <th>Damages</th>
                <th>Transfers</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {totals.rows.map((row, index) => (
                <tr key={row.id}>
                  <td><input value={row.drinkName} disabled={!editable} onChange={(e) => updateDepartmentRow(index, 'drinkName', e.target.value)} /></td>
                  <td><input type="number" value={row.openingStock} disabled={!editable} onChange={(e) => updateDepartmentRow(index, 'openingStock', Number(e.target.value))} /></td>
                  <td><input type="number" value={row.newStock} disabled={!editable} onChange={(e) => updateDepartmentRow(index, 'newStock', Number(e.target.value))} /></td>
                  <td><input type="number" value={row.totalStock} disabled readOnly /></td>
                  <td><input type="number" value={row.closingStock} disabled={!editable} onChange={(e) => updateDepartmentRow(index, 'closingStock', Number(e.target.value))} /></td>
                  <td><input type="number" value={row.drinksSold} disabled readOnly /></td>
                  <td><input type="number" value={row.price} disabled={!editable} onChange={(e) => updateDepartmentRow(index, 'price', Number(e.target.value))} /></td>
                  <td><input type="number" value={row.amount} disabled readOnly /></td>
                  <td><input type="number" value={row.damages} disabled={!editable} onChange={(e) => updateDepartmentRow(index, 'damages', Number(e.target.value))} /></td>
                  <td><input type="number" value={row.transfers} disabled={!editable} onChange={(e) => updateDepartmentRow(index, 'transfers', Number(e.target.value))} /></td>
                  <td>
                    <button
                      type="button"
                      className="row-remove-button"
                      onClick={() => removeDepartmentRow(row.id)}
                      disabled={!editable || record.rows.length <= 1}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="workspace-notes">
          {totals.warnings.length > 0 ? totals.warnings.map((item) => <p key={item} className="warning-text">{item}</p>) : <p className="ok-text">No stock mismatches detected.</p>}
        </div>

        <div className="workspace-summary-grid">
          <div className="summary-box"><span>Total sales</span><strong>{formatCurrency(totals.totalSales)}</strong></div>
          <div className="summary-box"><span>Transfers</span><input type="number" value={record.transfersSection} disabled={!editable} onChange={(e) => (module === 'vip'
            ? setVipRecords((prev) => prev.map((entry) => entry.id === selectedVipId ? { ...entry, transfersSection: Number(e.target.value) } : entry))
            : setBarRecords((prev) => prev.map((entry) => entry.id === selectedBarId ? { ...entry, transfersSection: Number(e.target.value) } : entry)))} /></div>
          <div className="summary-box"><span>POS</span><input type="number" value={record.pos} disabled={!editable} onChange={(e) => (module === 'vip'
            ? setVipRecords((prev) => prev.map((entry) => entry.id === selectedVipId ? { ...entry, pos: Number(e.target.value) } : entry))
            : setBarRecords((prev) => prev.map((entry) => entry.id === selectedBarId ? { ...entry, pos: Number(e.target.value) } : entry)))} /></div>
          <div className="summary-box"><span>Boss collected cash</span><input type="number" value={record.bossCollectedCash} disabled={!editable} onChange={(e) => (module === 'vip'
            ? setVipRecords((prev) => prev.map((entry) => entry.id === selectedVipId ? { ...entry, bossCollectedCash: Number(e.target.value) } : entry))
            : setBarRecords((prev) => prev.map((entry) => entry.id === selectedBarId ? { ...entry, bossCollectedCash: Number(e.target.value) } : entry)))} /></div>
        </div>

        <div className="workspace-summary-grid single">
          <div className="summary-box full">
            <span>Debts with explanation</span>
            <textarea value={record.debtsExplanation} disabled={!editable} onChange={(e) => (module === 'vip'
              ? setVipRecords((prev) => prev.map((entry) => entry.id === selectedVipId ? { ...entry, debtsExplanation: e.target.value } : entry))
              : setBarRecords((prev) => prev.map((entry) => entry.id === selectedBarId ? { ...entry, debtsExplanation: e.target.value } : entry)))} />
          </div>
        </div>

        <div className="workspace-summary-grid single">
          <div className="summary-box full debt-expense-box">
            <span>Debt ledger expense (accepted, unpaid)</span>
            <strong>{formatCurrency(debtExpense)}</strong>
          </div>
        </div>

        <div className="workspace-final">
          <div>
            <span>Computed cash after deductions</span>
            <strong>{formatCurrency(computedAfterDebt)}</strong>
          </div>
          <button onClick={submitCurrent} disabled={!editable}>Submit record</button>
        </div>
      </div>
    );
  };

  const renderReception = () => {
    const totals = receptionTotals;
    const debtExpense = debtLedgerService.getAcceptedUnpaidAmount('reception', receptionRecord.date);
    const netCashAfterDebt = totals.totals.cash - debtExpense;
    return (
      <div className="workspace-grid">
        <div className="workspace-header-row">
          <div>
            <h2>Reception Module</h2>
            <p>Track lodging records, split payments, and multi-day bookings.</p>
          </div>
          <div className="workspace-meta">
            <StatusBadge state={receptionDisplayStatus} />
            <span>{getRoleLabel(role)}</span>
          </div>
        </div>

        <div className="workspace-toolbar">
          <div className="toolbar-pill">Editing {editable ? 'enabled' : 'locked'}</div>
          <div className="toolbar-pill">State: {receptionDisplayStatus}</div>
          <div className="toolbar-pill">Date: {receptionRecord.date}</div>
        </div>

        {renderDailyHistory(
          receptionRecords.map((entry) => ({
            ...entry,
            status: resolvedStatusFor(entry.status, 'reception', entry.date),
          })),
          selectedReceptionId,
          setSelectedReceptionId,
        )}

        <div className="workspace-table-actions">
          <button type="button" onClick={addReceptionRow} disabled={!editable}>+ Add Lodging Entry</button>
        </div>

        <div className="workspace-table-wrap">
          <table className="workspace-table">
            <thead>
              <tr>
                <th>Customer name</th>
                <th>Sex</th>
                <th>Time in</th>
                <th>Time out</th>
                <th>Room</th>
                <th>ID</th>
                <th>POS</th>
                <th>Transfer</th>
                <th>Cash</th>
                <th>Duration</th>
                <th>Room rate</th>
                <th>Amount paid</th>
                <th>Existing</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {receptionRecord.rows.map((row, index) => (
                <tr key={row.id}>
                  <td><input value={row.customerName} disabled={!editable} onChange={(e) => updateReceptionRow(index, 'customerName', e.target.value)} /></td>
                  <td><select value={row.sex} disabled={!editable} onChange={(e) => updateReceptionRow(index, 'sex', e.target.value as 'Male' | 'Female' | 'Other')}><option>Male</option><option>Female</option><option>Other</option></select></td>
                  <td><input value={row.timeIn} disabled={!editable} onChange={(e) => updateReceptionRow(index, 'timeIn', e.target.value)} /></td>
                  <td><input value={row.timeOut} disabled={!editable} onChange={(e) => updateReceptionRow(index, 'timeOut', e.target.value)} /></td>
                  <td><input value={row.room} disabled={!editable} onChange={(e) => updateReceptionRow(index, 'room', e.target.value)} /></td>
                  <td><input value={row.idNumber} disabled={!editable} onChange={(e) => updateReceptionRow(index, 'idNumber', e.target.value)} /></td>
                  <td><input type="number" value={row.pos} disabled={!editable} onChange={(e) => updateReceptionRow(index, 'pos', Number(e.target.value))} /></td>
                  <td><input type="number" value={row.transfer} disabled={!editable} onChange={(e) => updateReceptionRow(index, 'transfer', Number(e.target.value))} /></td>
                  <td><input type="number" value={row.cash} disabled={!editable} onChange={(e) => updateReceptionRow(index, 'cash', Number(e.target.value))} /></td>
                  <td><input value={row.duration} disabled={!editable} onChange={(e) => updateReceptionRow(index, 'duration', e.target.value)} /></td>
                  <td><input type="number" value={row.roomRate} disabled={!editable} onChange={(e) => updateReceptionRow(index, 'roomRate', Number(e.target.value))} /></td>
                  <td><input type="number" value={row.amountPaid} disabled={!editable} onChange={(e) => updateReceptionRow(index, 'amountPaid', Number(e.target.value))} /></td>
                  <td><input type="checkbox" checked={row.existing} disabled={!editable} onChange={(e) => updateReceptionRow(index, 'existing', e.target.checked)} /></td>
                  <td>
                    <button
                      type="button"
                      className="row-remove-button"
                      onClick={() => removeReceptionRow(row.id)}
                      disabled={!editable}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="workspace-notes">
          {totals.warnings.length > 0 ? totals.warnings.map((item) => <p key={item} className="warning-text">{item}</p>) : <p className="ok-text">Split payments validation passed.</p>}
        </div>

        <div className="workspace-summary-grid">
          <div className="summary-box"><span>Total sales</span><strong>{formatCurrency(totals.totals.sales)}</strong></div>
          <div className="summary-box"><span>Total transfers</span><strong>{formatCurrency(totals.totals.transfer)}</strong></div>
          <div className="summary-box"><span>Total POS</span><strong>{formatCurrency(totals.totals.pos)}</strong></div>
          <div className="summary-box"><span>Total cash</span><strong>{formatCurrency(totals.totals.cash)}</strong></div>
        </div>

        <div className="workspace-summary-grid">
          <div className="summary-box"><span>Debt ledger expense</span><strong>{formatCurrency(debtExpense)}</strong></div>
          <div className="summary-box"><span>Net cash after debt</span><strong>{formatCurrency(netCashAfterDebt)}</strong></div>
          <div className="summary-box"><span>Debt resolution status</span><strong>{debtExpense > 0 ? 'Partially Resolved' : 'Clear'}</strong></div>
          <div className="summary-box"><span>Ledger source</span><strong>Debt page</strong></div>
        </div>

        <div className="workspace-final">
          <div>
            <span>Validation</span>
            <strong>{totals.totals.sales - totals.totals.transfer - totals.totals.pos <= totals.totals.cash ? 'Balanced' : 'Needs review'}</strong>
          </div>
          <button onClick={submitCurrent} disabled={!editable}>Submit record</button>
        </div>
      </div>
    );
  };

  const renderInventory = () => {
    const totals = inventoryTotals;
    return (
      <div className="workspace-grid">
        <div className="workspace-header-row">
          <div>
            <h2>Admin Inventory Module</h2>
            <p>Record purchases, manage stock transfers, and flag inconsistencies.</p>
          </div>
          <div className="workspace-meta">
            <StatusBadge state={inventoryRecord.status} />
            <span>{getRoleLabel(role)}</span>
          </div>
        </div>

        <div className="workspace-table-wrap">
          <table className="workspace-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit price</th>
                <th>Total cost</th>
                <th>Department</th>
                <th>Inconsistency</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {inventoryRecord.purchases.map((row, index) => (
                <tr key={row.id}>
                  <td><input value={row.itemName} disabled={!editable} onChange={(e) => updateInventoryRow(index, 'itemName', e.target.value)} /></td>
                  <td><input type="number" value={row.quantity} disabled={!editable} onChange={(e) => updateInventoryRow(index, 'quantity', Number(e.target.value))} /></td>
                  <td><input type="number" value={row.unitPrice} disabled={!editable} onChange={(e) => updateInventoryRow(index, 'unitPrice', Number(e.target.value))} /></td>
                  <td><input type="number" value={row.totalCost} disabled readOnly /></td>
                  <td><select value={row.department} disabled={!editable} onChange={(e) => updateInventoryRow(index, 'department', e.target.value as 'Store' | 'Bar' | 'VIP')}><option>Store</option><option>Bar</option><option>VIP</option></select></td>
                  <td><input value={row.inconsistency || ''} disabled={!editable} onChange={(e) => updateInventoryRow(index, 'inconsistency', e.target.value)} /></td>
                  <td>
                    <button
                      type="button"
                      className="row-remove-button"
                      onClick={() => removeInventoryRow(row.id)}
                      disabled={!editable}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="workspace-table-actions">
          <button type="button" onClick={addInventoryRow} disabled={!editable}>+ Add Inventory Item</button>
        </div>

        <div className="workspace-summary-grid">
          <div className="summary-box"><span>Purchases</span><strong>{formatCurrency(totals.purchasesTotal)}</strong></div>
          <div className="summary-box"><span>Transfer to Bar</span><input type="number" value={inventoryRecord.transfersToBar} disabled={!editable} onChange={(e) => setInventoryRecords((prev) => prev.map((entry) => entry.id === selectedInventoryId ? { ...entry, transfersToBar: Number(e.target.value) } : entry))} /></div>
          <div className="summary-box"><span>Transfer to VIP</span><input type="number" value={inventoryRecord.transfersToVip} disabled={!editable} onChange={(e) => setInventoryRecords((prev) => prev.map((entry) => entry.id === selectedInventoryId ? { ...entry, transfersToVip: Number(e.target.value) } : entry))} /></div>
          <div className="summary-box"><span>Flagged inconsistencies</span><strong>{totals.flaggedCount}</strong></div>
        </div>

        <div className="workspace-final">
          <div>
            <span>Store stock summary</span>
            <strong>{formatCurrency(totals.transferTotal)}</strong>
          </div>
          <button onClick={submitCurrent} disabled={!editable}>Submit inventory</button>
        </div>

        {renderDailyHistory(inventoryRecords, selectedInventoryId, setSelectedInventoryId)}
      </div>
    );
  };

  const renderApproval = () => {
    return (
      <div className="workspace-grid">
        <div className="workspace-header-row">
          <div>
            <h2>Boss Approval Module</h2>
            <p>Approve, reject, reopen, and sign off submitted accounts.</p>
          </div>
          <div className="workspace-meta">
            <StatusBadge state="reviewed" />
            <span>{getRoleLabel(role)}</span>
          </div>
        </div>

        <div className="approval-list">
          {approvalRecords.map((record) => (
            <div key={record.id} className="approval-card">
              <div className="approval-card-header">
                <div>
                  <h3>{record.title}</h3>
                  <p>{record.submittedBy}</p>
                </div>
                <StatusBadge state={record.status} />
              </div>
              <div className="approval-card-grid">
                <div><span>Module</span><strong>{record.module}</strong></div>
                <div><span>Debt status</span><strong>{record.debtStatus}</strong></div>
                <div><span>Cash at hand</span><strong>{formatCurrency(record.cashAtHand)}</strong></div>
                <div><span>Notes</span><strong>{record.notes}</strong></div>
              </div>
              <div className="approval-actions">
                <button disabled={!canPerformAction(role, 'approve')} onClick={() => setApprovalRecords((prev) => prev.map((item) => item.id === record.id ? { ...item, status: 'approved' } : item))}>Approve</button>
                <button disabled={!canPerformAction(role, 'reject')} onClick={() => setApprovalRecords((prev) => prev.map((item) => item.id === record.id ? { ...item, status: 'partially-resolved' } : item))}>Reject</button>
                <button disabled={!canPerformAction(role, 'reopen')} onClick={() => setApprovalRecords((prev) => prev.map((item) => item.id === record.id ? { ...item, status: 'draft' } : item))}>Reopen</button>
                <button disabled={!canPerformAction(role, 'confirm-cash')} onClick={() => setApprovalRecords((prev) => prev.map((item) => item.id === record.id ? { ...item, status: 'fully-resolved' } : item))}>Confirm cash</button>
                <button disabled={!canPerformAction(role, 'sign-off')} onClick={() => setApprovalRecords((prev) => prev.map((item) => item.id === record.id ? { ...item, notes: `${item.notes} | Signed off` } : item))}>Sign off</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="accounting-workspace">
      {warning ? <div className="workspace-warning">{warning}</div> : null}
      {module === 'vip' ? renderDepartment('VIP Module', vipRecord) : null}
      {module === 'bar' ? renderDepartment('Bar Module', barRecord) : null}
      {module === 'reception' ? renderReception() : null}
      {module === 'inventory' ? renderInventory() : null}
      {module === 'approval' ? renderApproval() : null}
    </div>
  );
}

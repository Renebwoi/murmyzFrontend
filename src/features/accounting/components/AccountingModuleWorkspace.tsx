import { useMemo, useState } from 'react';
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
import { StatusBadge } from './StatusBadge';
import './AccountingModuleWorkspace.css';

interface AccountingModuleWorkspaceProps {
  module: AccountingModule;
  role: UserRole;
}


function isLocked(state: RecordState) {
  return state !== 'draft';
}

export function AccountingModuleWorkspace({ module, role }: AccountingModuleWorkspaceProps) {
  const navigate = useNavigate();
  const [approvalRecords, setApprovalRecords] = useState<ApprovalRecord[]>(MOCK_APPROVAL_RECORDS);
  const [vipRecord, setVipRecord] = useState<DepartmentModuleState>(MOCK_VIP_RECORD);
  const [barRecord, setBarRecord] = useState<DepartmentModuleState>(MOCK_BAR_RECORD);
  const [receptionRecord, setReceptionRecord] = useState<ReceptionModuleState>(MOCK_RECEPTION_RECORD);
  const [inventoryRecord, setInventoryRecord] = useState<InventoryModuleState>(MOCK_INVENTORY_RECORD);
  const [warning, setWarning] = useState<string | null>(null);

  const allowed = canAccessModule(role, module);
  const editable = module === 'approval' ? false : canEditModule(role, module, module === 'vip' ? vipRecord.status : module === 'bar' ? barRecord.status : module === 'reception' ? receptionRecord.status : inventoryRecord.status);
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

  const updateDepartmentRow = (index: number, field: keyof DepartmentModuleState['rows'][number], value: string | number) => {
    const updater = module === 'vip' ? setVipRecord : setBarRecord;
    updater((prev) => {
      if (isLocked(prev.status) && role !== 'boss') return prev;
      const rows = prev.rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row));
      return { ...prev, rows, warnings: [] } as DepartmentModuleState;
    });
  };

  const updateReceptionRow = (index: number, field: keyof ReceptionModuleState['rows'][number], value: string | number | boolean) => {
    setReceptionRecord((prev) => {
      if (isLocked(prev.status) && role !== 'boss') return prev;
      const rows = prev.rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row));
      return { ...prev, rows, warnings: [] };
    });
  };

  const updateInventoryRow = (index: number, field: keyof InventoryModuleState['purchases'][number], value: string | number) => {
    setInventoryRecord((prev) => {
      if (isLocked(prev.status) && role !== 'boss') return prev;
      const purchases = prev.purchases.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row));
      return { ...prev, purchases };
    });
  };

  const submitCurrent = async () => {
    if (!canPerformAction(role, 'submit')) {
      setWarning('Your role cannot submit this record.');
      return;
    }

    if (module === 'vip') setVipRecord((prev) => ({ ...prev, status: 'submitted' }));
    if (module === 'bar') setBarRecord((prev) => ({ ...prev, status: 'submitted' }));
    if (module === 'reception') setReceptionRecord((prev) => ({ ...prev, status: 'submitted' }));
    if (module === 'inventory') setInventoryRecord((prev) => ({ ...prev, status: 'submitted' }));

    try {
      await accountingService.submitRecord(module, module === 'approval' ? 'approval' : (module === 'vip' ? vipRecord.id : module === 'bar' ? barRecord.id : module === 'reception' ? receptionRecord.id : inventoryRecord.id));
    } catch {
      // offline-friendly UI; backend sync will activate later
    }
  };

  const renderDepartment = (title: string, record: DepartmentModuleState) => {
    const totals = calculateDepartmentTotals(record);
    return (
      <div className="workspace-grid">
        <div className="workspace-header-row">
          <div>
            <h2>{title}</h2>
            <p>{selectedOption?.description}</p>
          </div>
          <div className="workspace-meta">
            <StatusBadge state={record.status} />
            <span>{getRoleLabel(role)}</span>
          </div>
        </div>

        <div className="workspace-toolbar">
          <div className="toolbar-pill">Editing {editable ? 'enabled' : 'locked'}</div>
          <div className="toolbar-pill">State: {record.status}</div>
          <div className="toolbar-pill">Date: {record.date}</div>
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
          <div className="summary-box"><span>Transfers</span><input type="number" value={record.transfersSection} disabled={!editable} onChange={(e) => (module === 'vip' ? setVipRecord((prev) => ({ ...prev, transfersSection: Number(e.target.value) })) : setBarRecord((prev) => ({ ...prev, transfersSection: Number(e.target.value) })))} /></div>
          <div className="summary-box"><span>POS</span><input type="number" value={record.pos} disabled={!editable} onChange={(e) => (module === 'vip' ? setVipRecord((prev) => ({ ...prev, pos: Number(e.target.value) })) : setBarRecord((prev) => ({ ...prev, pos: Number(e.target.value) })))} /></div>
          <div className="summary-box"><span>Boss collected cash</span><input type="number" value={record.bossCollectedCash} disabled={!editable} onChange={(e) => (module === 'vip' ? setVipRecord((prev) => ({ ...prev, bossCollectedCash: Number(e.target.value) })) : setBarRecord((prev) => ({ ...prev, bossCollectedCash: Number(e.target.value) })))} /></div>
        </div>

        <div className="workspace-summary-grid single">
          <div className="summary-box full">
            <span>Debts with explanation</span>
            <textarea value={record.debtsExplanation} disabled={!editable} onChange={(e) => (module === 'vip' ? setVipRecord((prev) => ({ ...prev, debtsExplanation: e.target.value })) : setBarRecord((prev) => ({ ...prev, debtsExplanation: e.target.value })))} />
          </div>
        </div>

        <div className="workspace-final">
          <div>
            <span>Computed cash after deductions</span>
            <strong>{formatCurrency(totals.computedCash)}</strong>
          </div>
          <button onClick={submitCurrent} disabled={!editable}>Submit record</button>
        </div>
      </div>
    );
  };

  const renderReception = () => {
    const totals = receptionTotals;
    return (
      <div className="workspace-grid">
        <div className="workspace-header-row">
          <div>
            <h2>Reception Module</h2>
            <p>Track lodging records, split payments, and multi-day bookings.</p>
          </div>
          <div className="workspace-meta">
            <StatusBadge state={receptionRecord.status} />
            <span>{getRoleLabel(role)}</span>
          </div>
        </div>

        <div className="workspace-toolbar">
          <div className="toolbar-pill">Editing {editable ? 'enabled' : 'locked'}</div>
          <div className="toolbar-pill">State: {receptionRecord.status}</div>
          <div className="toolbar-pill">Date: {receptionRecord.date}</div>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="workspace-summary-grid">
          <div className="summary-box"><span>Purchases</span><strong>{formatCurrency(totals.purchasesTotal)}</strong></div>
          <div className="summary-box"><span>Transfer to Bar</span><input type="number" value={inventoryRecord.transfersToBar} disabled={!editable} onChange={(e) => setInventoryRecord((prev) => ({ ...prev, transfersToBar: Number(e.target.value) }))} /></div>
          <div className="summary-box"><span>Transfer to VIP</span><input type="number" value={inventoryRecord.transfersToVip} disabled={!editable} onChange={(e) => setInventoryRecord((prev) => ({ ...prev, transfersToVip: Number(e.target.value) }))} /></div>
          <div className="summary-box"><span>Flagged inconsistencies</span><strong>{totals.flaggedCount}</strong></div>
        </div>

        <div className="workspace-final">
          <div>
            <span>Store stock summary</span>
            <strong>{formatCurrency(totals.transferTotal)}</strong>
          </div>
          <button onClick={submitCurrent} disabled={!editable}>Submit inventory</button>
        </div>
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

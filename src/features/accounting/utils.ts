import type {
  DepartmentModuleState,
  ReceptionModuleState,
  InventoryModuleState,
  RecordState,
} from "./types";

const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function toTitle(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getStatusTone(state: RecordState) {
  switch (state) {
    case "draft":
      return "neutral";
    case "submitted":
      return "warning";
    case "reviewed":
      return "info";
    case "approved":
      return "success";
    case "partially-resolved":
      return "warning";
    case "fully-resolved":
      return "success";
    default:
      return "neutral";
  }
}

export function calculateDepartmentTotals(record: DepartmentModuleState) {
  const rows = record.rows.map((row, index) => {
    const totalStock = row.openingStock + row.newStock;
    const drinksSold = Math.max(
      totalStock - row.closingStock - row.damages - row.transfers,
      0,
    );
    const amount = drinksSold * row.price;
    const warning =
      index < record.rows.length - 1 &&
      record.rows[index + 1].openingStock !== row.closingStock
        ? `Next opening stock must match ${row.drinkName} closing stock`
        : "";

    return {
      ...row,
      totalStock,
      drinksSold,
      amount,
      warning,
    };
  });

  const totals = rows.reduce(
    (acc, row) => ({
      sales: acc.sales + row.amount,
      transfers: acc.transfers + row.transfers,
      damages: acc.damages + row.damages,
    }),
    { sales: 0, transfers: 0, damages: 0 },
  );

  const computedCash =
    totals.sales -
    record.transfersSection -
    record.pos -
    record.bossCollectedCash -
    totals.damages;

  return {
    rows,
    totalSales: totals.sales,
    totalTransfers: totals.transfers,
    totalDamages: totals.damages,
    computedCash,
    warnings: rows.map((row) => row.warning).filter(Boolean),
  };
}

export function calculateReceptionTotals(record: ReceptionModuleState) {
  const totals = record.rows.reduce(
    (acc, row) => ({
      sales: acc.sales + row.amountPaid,
      transfer: acc.transfer + row.transfer,
      pos: acc.pos + row.pos,
      cash: acc.cash + row.cash,
    }),
    { sales: 0, transfer: 0, pos: 0, cash: 0 },
  );

  const warnings = record.rows
    .map((row) =>
      row.amountPaid - row.transfer - row.pos > row.cash
        ? `${row.customerName}: split payments exceed cash`
        : "",
    )
    .filter(Boolean);

  return {
    totals,
    warnings,
  };
}

export function calculateInventoryTotals(record: InventoryModuleState) {
  const purchasesTotal = record.purchases.reduce(
    (sum, item) => sum + item.totalCost,
    0,
  );
  return {
    purchasesTotal,
    transferTotal: record.transfersToBar + record.transfersToVip,
    flaggedCount: record.flaggedInconsistencies.length,
  };
}

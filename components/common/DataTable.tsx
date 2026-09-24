import { cn } from '@/lib/utils';
import Spinner from './Spinner';
import EmptyState from './EmptyState';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  width?: string;        // e.g. 'w-32'
  render: (row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  isLoading?: boolean;
  /** Overrides default EmptyState when no rows */
  emptyState?: React.ReactNode;
  emptyTitle?: string;
  emptySubtitle?: string;
  onRowClick?: (row: T) => void;
  /** Extra classes on the outer container card */
  className?: string;
  /** Extra classes on <tbody> rows */
  rowClassName?: (row: T) => string;
  /** Show zebra-stripe instead of divider lines */
  striped?: boolean;
  /** Compact mode — smaller cell padding */
  compact?: boolean;
}

const alignMap = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

/**
 * Unified data table — the single most-duplicated pattern in the app.
 * Found in 30+ instances across settings (10x), pharmacy (7x), cosgyn (5x),
 * analytics (4x), ipd, lims, billing, fertility, patients.
 *
 * Each instance was re-implementing:
 *   - bg-white border rounded-lg overflow-hidden card wrapper
 *   - overflow-x-auto scroll container
 *   - thead with bg-slate-50 border-b uppercase tracking-wider
 *   - tbody with divide-y hover:bg-slate-50
 *   - loading state (spinner)
 *   - empty state
 *
 * Usage:
 *   <DataTable
 *     columns={[
 *       { key: 'name', header: 'Patient', render: row => <b>{row.name}</b> },
 *       { key: 'status', header: 'Status', align: 'right',
 *         render: row => <StatusBadge status={row.status} /> },
 *     ]}
 *     rows={filteredInvoices}
 *     rowKey={row => row.id}
 *     isLoading={isLoading}
 *   />
 */
export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading = false,
  emptyState,
  emptyTitle = 'No records found',
  emptySubtitle = 'Try adjusting your search or filters.',
  onRowClick,
  className,
  rowClassName,
  striped = false,
  compact = false,
}: DataTableProps<T>) {
  const cellPad = compact ? 'p-2.5' : 'p-3.5';

  return (
    <div
      className={cn(
        'bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden',
        className,
      )}
    >
      {isLoading ? (
        <Spinner size="lg" fullPage />
      ) : rows.length === 0 ? (
        emptyState ?? (
          <EmptyState title={emptyTitle} subtitle={emptySubtitle} />
        )
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(cellPad, alignMap[col.align ?? 'left'], col.width)}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody
              className={cn(
                'font-medium text-slate-700',
                striped ? '' : 'divide-y divide-slate-100',
              )}
            >
              {rows.map((row, idx) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'transition-colors',
                    striped && idx % 2 !== 0 ? 'bg-slate-50/60' : '',
                    onRowClick ? 'cursor-pointer hover:bg-primary/5' : 'hover:bg-slate-50',
                    rowClassName?.(row),
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(cellPad, alignMap[col.align ?? 'left'])}
                    >
                      {col.render(row, idx)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

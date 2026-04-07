import { useState, ReactNode } from 'react';
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  Row,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  pageSize?: number;
  emptyMessage?: string;
  renderAfterRows?: () => ReactNode;
  className?: string;
}

/** Drop this into any column's `header` to get a clickable sort indicator. */
export function SortableHeader({
  column,
  children,
  className,
}: {
  column: any;
  children: ReactNode;
  className?: string;
}) {
  const sorted = column.getIsSorted();
  return (
    <button
      className={cn('flex items-center gap-1 hover:text-foreground transition-colors select-none', className)}
      onClick={() => column.toggleSorting(sorted === 'asc')}
    >
      {children}
      {sorted === 'asc' ? (
        <ChevronUp className="h-3.5 w-3.5 shrink-0" />
      ) : sorted === 'desc' ? (
        <ChevronDown className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 shrink-0 opacity-40" />
      )}
    </button>
  );
}

export function DataTable<TData>({
  columns,
  data,
  pageSize,
  emptyMessage = 'Nenhum dado encontrado.',
  renderAfterRows,
  className,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable<TData>({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(pageSize
      ? {
          getPaginationRowModel: getPaginationRowModel(),
          initialState: { pagination: { pageSize } },
        }
      : {}),
  });

  return (
    <div className={className}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id}>
                {hg.headers.map(header => (
                  <TableHead
                    key={header.id}
                    style={header.column.columnDef.size ? { width: header.column.columnDef.size } : undefined}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-12 text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
            {renderAfterRows?.()}
          </TableBody>
        </Table>
      </div>

      {pageSize && table.getPageCount() > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <span className="text-sm text-muted-foreground">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()} ({data.length} registros)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Próxima
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

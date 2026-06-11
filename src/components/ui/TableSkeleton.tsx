interface TableSkeletonProps {
  cols: number;
  rows?: number;
}

const COL_WIDTHS = ["w-28", "w-20", "w-24", "w-16", "w-20", "w-12"];

export function TableSkeleton({ cols, rows = 5 }: TableSkeletonProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-6 py-3">
                <div className="h-2.5 bg-gray-200 rounded animate-pulse w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {Array.from({ length: rows }).map((_, ri) => (
            <tr key={ri}>
              {Array.from({ length: cols }).map((_, ci) => (
                <td key={ci} className="px-6 py-4">
                  {ci === 0 ? (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gray-200 animate-pulse shrink-0" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-28" />
                    </div>
                  ) : ci === cols - 1 ? (
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse" />
                      <div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse" />
                    </div>
                  ) : (
                    <div className={`h-3 bg-gray-200 rounded animate-pulse ${COL_WIDTHS[ci % COL_WIDTHS.length]}`} />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-gray-200 animate-pulse h-40" />
      ))}
    </div>
  );
}

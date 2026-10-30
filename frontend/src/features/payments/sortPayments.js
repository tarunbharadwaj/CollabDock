export const PAYMENT_SORT_DEFAULT_DIRECTIONS = {
  brand: 'asc',
  progress: 'desc',
  outstanding: 'desc',
  dueDate: 'asc',
  status: 'asc',
};

function progress(row) {
  return row.dealValuePaisa > 0 ? row.receivedPaisa / row.dealValuePaisa : 0;
}

function compareText(first = '', second = '') {
  return first.localeCompare(second, 'en', { sensitivity: 'base', numeric: true });
}

export function sortPaymentRows(rows, sort) {
  if (!sort?.key) return rows;
  const direction = sort.direction === 'desc' ? -1 : 1;

  return [...rows].sort((first, second) => {
    if (sort.key === 'dueDate') {
      if (!first.paymentDueDate && !second.paymentDueDate) return 0;
      if (!first.paymentDueDate) return 1;
      if (!second.paymentDueDate) return -1;
      return (new Date(first.paymentDueDate).getTime() - new Date(second.paymentDueDate).getTime()) * direction;
    }

    let comparison = 0;
    if (sort.key === 'brand') {
      comparison = compareText(first.brandName, second.brandName)
        || compareText(first.campaignTitle, second.campaignTitle);
    } else if (sort.key === 'progress') {
      comparison = progress(first) - progress(second);
    } else if (sort.key === 'outstanding') {
      comparison = first.outstandingPaisa - second.outstandingPaisa;
    } else if (sort.key === 'status') {
      comparison = compareText(first.paymentStatus, second.paymentStatus);
    }
    return comparison * direction;
  });
}

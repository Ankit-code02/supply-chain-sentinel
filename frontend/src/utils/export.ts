
function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return '""'

  let text =
    typeof value === 'object'
      ? JSON.stringify(value)
      : String(value)

  // Protect spreadsheet users from formula injection in text fields.
  if (
    typeof value === 'string' &&
    /^[=+\-@\t\r]/.test(text)
  ) {
    text = `'${text}`
  }

  return `"${text.replaceAll('"', '""')}"`
}

export function exportCsv<T extends object>(
  filename: string,
  rows: T[],
): void {
  if (rows.length === 0) {
    window.alert('There is no data available to export yet.')
    return
  }

  const headers = Array.from(
    rows.reduce((keys, row) => {
      Object.keys(row).forEach((key) => keys.add(key))
      return keys
    }, new Set<string>()),
  )

  const csv = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row) =>
      headers
        .map((header) => escapeCsvValue(row[header as keyof T]))
        .join(','),
    ),
  ].join('\r\n')

  const blob = new Blob(['\uFEFF', csv], {
    type: 'text/csv;charset=utf-8;',
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()

  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function printReport(): void {
  window.print()
}


import * as XLSX from 'xlsx'
import * as LegacyFileSystem from 'expo-file-system/legacy'
import { Alert } from '../../components/Alert'
// import { Alert } from "react-native"

// =========================================================
// EXCEL HELPERS
// =========================================================

const getExcelWeight = (bill) => {
  const kilo = parseFloat(bill?.item_kilo || 0)
  const gram = parseFloat(bill?.item_gram || 0)

  return Number((kilo + gram / 1000).toFixed(2))
}

const sanitizeSheetName = (name, usedNames = new Set()) => {
  let sheetName = String(name || 'UNKNOWN')
    .replace(/[\\/?*[\]:]/g, '_')
    .trim()

  if (!sheetName) {
    sheetName = 'UNKNOWN'
  }

  sheetName = sheetName.substring(0, 31)

  // Excel does not allow duplicate sheet names
  let finalName = sheetName
  let counter = 1

  while (usedNames.has(finalName)) {
    const suffix = `_${counter++}`
    finalName =
      sheetName.substring(0, 31 - suffix.length) + suffix
  }

  usedNames.add(finalName)

  return finalName
}


// =========================================================
// EXCEL HEADER
// =========================================================

const buildExcelHeader = (ws, title, dayInput) => {
  ws['A1'] = {
    v: company?.header_1 || '',
    t: 's',
  }

  ws['A2'] = {
    v: company?.header_2 || '',
    t: 's',
  }

  ws['A3'] = {
    v: company?.header_3 || '',
    t: 's',
  }

  ws['C4'] = {
    v: `ቀን ${dayInput}`,
    t: 's',
  }

  ws['A5'] = {
    v: title || '',
    t: 's',
  }

  ws['B6'] = {
    v: 'M.AWB',
    t: 's',
  }
}


// =========================================================
// EXCEL TABLE HEADER
// =========================================================

const buildExcelTableHeader = (ws) => {
  const headers = [
    'NO',
    'COU AWB',
    'Item DESCRIPTION',
    'GROWS WEIGHT (KG)',
    'Destination',
  ]

  headers.forEach((value, col) => {
    const address = XLSX.utils.encode_cell({
      r: 6,
      c: col,
    })

    ws[address] = {
      v: value,
      t: 's',
    }
  })
}


// =========================================================
// CELL BORDER
// =========================================================

const excelBorder = {
  top: {
    style: 'thin',
    color: {
      rgb: '000000',
    },
  },
  bottom: {
    style: 'thin',
    color: {
      rgb: '000000',
    },
  },
  left: {
    style: 'thin',
    color: {
      rgb: '000000',
    },
  },
  right: {
    style: 'thin',
    color: {
      rgb: '000000',
    },
  },
}


// =========================================================
// APPLY COMMON STYLES
// =========================================================

const styleExcelCell = (
  cell,
  {
    bold = false,
    size = 11,
    color = '000000',
    background = null,
    center = false,
    border = false,
  } = {}
) => {
  if (!cell) return

  cell.s = {
    font: {
      name: 'Cambria',
      sz: size,
      bold,
      color: {
        rgb: color,
      },
    },

    alignment: {
      vertical: 'center',
      horizontal: center ? 'center' : 'left',
      wrapText: true,
    },

    ...(background
      ? {
          fill: {
            patternType: 'solid',
            fgColor: {
              rgb: background,
            },
          },
        }
      : {}),

    ...(border
      ? {
          border: excelBorder,
        }
      : {}),
  }
}


// =========================================================
// BUILD COMPLETE EXCEL SHEET
// =========================================================

  const getDescription = (bill) => {
    return bill?.description || bill?.service_type?.name || ''
  }
const buildExcelSheet = (data, title, company, dayInput) => {
  const rows = []

  // -------------------------
  // Header
  // -------------------------

  rows.push([
    company?.header_1 || '',
  ])

  rows.push([
    company?.header_2 || '',
  ])

  rows.push([
    company?.header_3 || '',
  ])

  rows.push([
    '',
    '',
    `ቀን ${dayInput}`,
  ])

  rows.push([
    title || '',
  ])

  rows.push([
    '',
    'M.AWB',
  ])

  // -------------------------
  // Table header
  // -------------------------

  rows.push([
    'NO',
    'COU AWB',
    'Item DESCRIPTION',
    'GROWS WEIGHT (KG)',
    'Destination',
  ])

  // -------------------------
  // Data
  // -------------------------

  data.forEach((bill, index) => {
    rows.push([
      index + 1,
      bill?.tracking_no || '',
      getDescription(bill),
      getExcelWeight(bill),
      bill?.destiny_branch?.code || '-',
    ])
  })

  // -------------------------
  // Footer
  // -------------------------

  rows.push([])

  rows.push([
    company?.footer_1 || '',
    '',
    '',
    '',
    `ቀን፡ ${dayInput}`,
  ])

  const ws = XLSX.utils.aoa_to_sheet(rows)

  // =====================================================
  // COLUMN WIDTHS
  // =====================================================

  ws['!cols'] = [
    { wch: 8 },
    { wch: 20 },
    { wch: 30 },
    { wch: 20 },
    { wch: 15 },
  ]

  // =====================================================
  // HEADER STYLES
  // =====================================================

  styleExcelCell(ws['A1'], {
    bold: true,
    size: 16,
  })

  styleExcelCell(ws['A2'], {
    bold: true,
    size: 14,
  })

  styleExcelCell(ws['A3'], {
    bold: true,
    size: 12,
  })

  styleExcelCell(ws['C4'], {
    bold: true,
    size: 14,
  })

  styleExcelCell(ws['A5'], {
    bold: true,
    size: 12,
  })

  styleExcelCell(ws['B6'], {
    bold: true,
    size: 11,
  })

  // =====================================================
  // TABLE HEADER
  // =====================================================

  for (let col = 0; col < 5; col++) {
    const address = XLSX.utils.encode_cell({
      r: 6,
      c: col,
    })

    styleExcelCell(ws[address], {
      bold: true,
      size: 11,
      color: '000000',
      background: 'FFFF00',
      center: true,
      border: true,
    })
  }

  // =====================================================
  // TABLE BODY
  // =====================================================

  const firstDataRow = 7
  const lastDataRow = firstDataRow + data.length - 1

  for (
    let row = firstDataRow;
    row <= lastDataRow;
    row++
  ) {
    for (let col = 0; col < 5; col++) {
      const address = XLSX.utils.encode_cell({
        r: row,
        c: col,
      })

      if (!ws[address]) continue

      styleExcelCell(ws[address], {
        size: 11,
        border: true,
        center: col === 0 || col === 3,
      })
    }
  }

  // =====================================================
  // FOOTER
  // =====================================================

  const footerRow =
    data.length + 8

  styleExcelCell(
    ws[
      XLSX.utils.encode_cell({
        r: footerRow,
        c: 0,
      })
    ],
    {
      bold: true,
      size: 11,
    }
  )

  styleExcelCell(
    ws[
      XLSX.utils.encode_cell({
        r: footerRow,
        c: 4,
      })
    ],
    {
      bold: true,
      size: 11,
    }
  )

  return ws
}

const sanitizeFileName = (
  name,
  fallback = 'Selected_Bills'
) => {
  const cleaned = String(name || '')
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, '_')

  return cleaned || fallback
}


// =========================================================
// DOWNLOAD EXCEL
// =========================================================

export const downloadExcel = async (bills, setExporting, getFileName, company, dayInput, totalWeight, shareFile) => {
  if (!bills.length) {
    Alert.alert(
      'No bills',
      'There are no bills to export.'
    )

    return
  }

  try {
    setExporting(true)

    // -----------------------------------------------------
    // FILE NAME
    // -----------------------------------------------------

    const fileName = await getFileName(
      `${company?.name || 'Selected_Bills'}-${dayInput}`
    )

    if (!fileName) {
      return
    }

    const safeName = sanitizeFileName(
      fileName,
      'Selected_Bills'
    )

    // -----------------------------------------------------
    // WORKBOOK
    // -----------------------------------------------------

    const workbook = XLSX.utils.book_new()

    const usedSheetNames = new Set()

    // =====================================================
    // GROUP BY DESTINATION
    // =====================================================

    const grouped = bills.reduce(
      (acc, bill) => {
        const key =
          bill?.destiny_branch?.code ||
          'UNKNOWN'

        if (!acc[key]) {
          acc[key] = []
        }

        acc[key].push(bill)

        return acc
      },
      {}
    )

    // =====================================================
    // DESTINATION SHEETS
    // =====================================================

    Object.keys(grouped).forEach(
      (branchCode) => {
        const data = grouped[branchCode]

        const ws = buildExcelSheet(
          data,
          branchCode,
          company,
          dayInput
        )

        const sheetName =
          sanitizeSheetName(
            branchCode,
            usedSheetNames
          )

        XLSX.utils.book_append_sheet(
          workbook,
          ws,
          sheetName
        )
      }
    )

    // =====================================================
    // SUMMARY SHEET
    // =====================================================

    const summary = buildExcelSheet(
      bills,
      'ማጠቃለያ',
      company,
      dayInput
    )

    const summarySheetName =
      sanitizeSheetName(
        'ማጠቃለያ',
        usedSheetNames
      )

    XLSX.utils.book_append_sheet(
      workbook,
      summary,
      summarySheetName
    )

    // =====================================================
    // SUMMARY TOTALS
    // =====================================================

    const summaryStartRow =
      bills.length + 10

    summary[
      `A${summaryStartRow}`
    ] = {
      v: 'Total Shipments',
      t: 's',
    }

    summary[
      `B${summaryStartRow}`
    ] = {
      v: bills.length,
      t: 'n',
    }

    summary[
      `A${summaryStartRow + 1}`
    ] = {
      v: 'Total Weight (KG)',
      t: 's',
    }

    summary[
      `B${summaryStartRow + 1}`
    ] = {
      v: Number(totalWeight.toFixed(2)),
      t: 'n',
    }

    styleExcelCell(
      summary[`A${summaryStartRow}`],
      {
        bold: true,
      }
    )

    styleExcelCell(
      summary[`B${summaryStartRow}`],
      {
        bold: true,
      }
    )

    styleExcelCell(
      summary[`A${summaryStartRow + 1}`],
      {
        bold: true,
      }
    )

    styleExcelCell(
      summary[`B${summaryStartRow + 1}`],
      {
        bold: true,
      }
    )

    // =====================================================
    // DASHBOARD
    // =====================================================

    const dashboardData = [
      ['📊 Logistics Dashboard'],
      [],
      [
        'Total Shipments',
        bills.length,
      ],
      [
        'Total Weight (KG)',
        Number(totalWeight.toFixed(2)),
      ],
      [
        'Average Weight',
        bills.length
          ? Number(
              (
                totalWeight /
                bills.length
              ).toFixed(2)
            )
          : 0,
      ],
      [
        'Destinations',
        Object.keys(grouped).length,
      ],
      [],
      [
        'Destination',
        'Shipments',
        'Weight (KG)',
      ],
    ]

    // -----------------------------------------------------
    // Destination statistics
    // -----------------------------------------------------

    const stats = Object.keys(grouped)
      .map((code) => {
        const destinationBills =
          grouped[code]

        const weight =
          destinationBills.reduce(
            (sum, bill) =>
              sum + getExcelWeight(bill),
            0
          )

        return {
          code,
          count:
            destinationBills.length,
          weight,
        }
      })
      .sort(
        (a, b) =>
          b.count - a.count
      )

    stats.forEach((item) => {
      dashboardData.push([
        item.code,
        item.count,
        Number(
          item.weight.toFixed(2)
        ),
      ])
    })

    const dashboard =
      XLSX.utils.aoa_to_sheet(
        dashboardData
      )

    // =====================================================
    // DASHBOARD COLUMN WIDTHS
    // =====================================================

    dashboard['!cols'] = [
      { wch: 25 },
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
    ]

    // =====================================================
    // MERGE DASHBOARD TITLE
    // =====================================================

    dashboard['!merges'] = [
      {
        s: {
          r: 0,
          c: 0,
        },
        e: {
          r: 0,
          c: 3,
        },
      },
    ]

    // =====================================================
    // DASHBOARD TITLE
    // =====================================================

    styleExcelCell(
      dashboard['A1'],
      {
        bold: true,
        size: 18,
        center: true,
      }
    )

    // =====================================================
    // KPI STYLES
    // =====================================================

    for (let row = 2; row <= 5; row++) {
      styleExcelCell(
        dashboard[
          `A${row + 1}`
        ],
        {
          bold: true,
        }
      )

      styleExcelCell(
        dashboard[
          `B${row + 1}`
        ],
        {
          bold: true,
          center: true,
        }
      )
    }

    // =====================================================
    // DASHBOARD TABLE HEADER
    // =====================================================

    for (let col = 0; col < 3; col++) {
      const address =
        XLSX.utils.encode_cell({
          r: 7,
          c: col,
        })

      styleExcelCell(
        dashboard[address],
        {
          bold: true,
          center: true,
          background: 'FFD700',
          border: true,
        }
      )
    }

    // =====================================================
    // DASHBOARD DATA
    // =====================================================

    for (
      let row = 8;
      row < 8 + stats.length;
      row++
    ) {
      for (let col = 0; col < 3; col++) {
        const address =
          XLSX.utils.encode_cell({
            r: row,
            c: col,
          })

        if (!dashboard[address]) {
          continue
        }

        styleExcelCell(
          dashboard[address],
          {
            border: true,
            center:
              col === 1 ||
              col === 2,
          }
        )
      }
    }

    // =====================================================
    // ADD DASHBOARD
    // =====================================================

    XLSX.utils.book_append_sheet(
      workbook,
      dashboard,
      'Dashboard'
    )

    // =====================================================
    // GENERATE XLSX BASE64
    // =====================================================

    const base64 = XLSX.write(
      workbook,
      {
        type: 'base64',
        bookType: 'xlsx',
        cellStyles: true,
      }
    )

    // =====================================================
    // SAVE FILE
    // =====================================================

    const fileUri =
      `${LegacyFileSystem.cacheDirectory}${safeName}.xlsx`

    // Remove previous file
    const existing =
      await LegacyFileSystem.getInfoAsync(
        fileUri
      )

    if (existing.exists) {
      await LegacyFileSystem.deleteAsync(
        fileUri,
        {
          idempotent: true,
        }
      )
    }

    await LegacyFileSystem.writeAsStringAsync(
      fileUri,
      base64,
      {
        encoding:
          LegacyFileSystem.EncodingType.Base64,
      }
    )

    // =====================================================
    // VERIFY
    // =====================================================

    const info =
      await LegacyFileSystem.getInfoAsync(
        fileUri
      )

    if (!info.exists) {
      throw new Error(
        'Excel file was not created.'
      )
    }

    console.log(
      'Excel created:',
      fileUri
    )

    // =====================================================
    // SHARE
    // =====================================================

    await shareFile(
      fileUri,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Share Excel File'
    )
  } catch (err) {
    console.error(
      'Excel export error:',
      err
    )

    Alert.alert(
      'Excel Error',
      err?.message ||
        'Unable to create the Excel file.'
    )
  } finally {
    setExporting(false)
  }
}

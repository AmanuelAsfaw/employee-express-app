import React, { useMemo, useRef, useState } from 'react'
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
// import * as LegacyFileSystem from 'expo-file-system'
import * as LegacyFileSystem from 'expo-file-system/legacy'
import { File, Paths } from 'expo-file-system'
import { captureRef } from 'react-native-view-shot'
import * as XLSX from 'xlsx'

import { END_POINT } from '../../constants/urls'
import { toEthiopianDate } from '../../utils/other_utils'
import { downloadExcel } from '../../utils/bills/excel_utils'
import { Alert } from '../Alert'

const CustomCommissionPrint = ({
  bills = [],
  company,
  loading = false,
  error = null,
}) => {
  const printRef = useRef(null)

  const today = useMemo(() => {
    const date = toEthiopianDate(new Date())

    return `${date.day}/${date.month}/${date.year}`
  }, [])

  const [dayInput, setDayInput] = useState(today)
  const [exporting, setExporting] = useState(false)

  // =========================================================
  // HELPERS
  // =========================================================

  const calcWeight = (bill) => {
    const kilo = parseFloat(bill?.item_kilo || 0)
    const gram = parseFloat(bill?.item_gram || 0)

    return kilo + gram / 1000
  }

  const formatWeight = (bill) => {
    return calcWeight(bill).toFixed(2)
  }

  const totalWeight = useMemo(() => {
    return bills.reduce((sum, bill) => {
      return sum + calcWeight(bill)
    }, 0)
  }, [bills])

  const logoUri = company?.logo
    ? `${END_POINT}${company.logo}`
    : null

  const getDescription = (bill) => {
    return bill?.description || bill?.service_type?.name || ''
  }

  // =========================================================
  // GROUP BY DESTINATION
  // =========================================================

  const groupedBills = useMemo(() => {
    return bills.reduce((acc, bill) => {
      const key = bill?.destiny_branch?.code || 'UNKNOWN'

      if (!acc[key]) {
        acc[key] = []
      }

      acc[key].push(bill)

      return acc
    }, {})
  }, [bills])

  // =========================================================
  // SHARE FILE
  // =========================================================
    const sanitizeFileName = (name, fallback = 'Selected_Bills') => {
    const cleaned = String(name || '')
        .trim()
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
        .replace(/\s+/g, '_')

    return cleaned || fallback
    }

  const shareFile = async (uri, mimeType, dialogTitle) => {
    try {
        const available = await Sharing.isAvailableAsync()

        if (!available) {
        Alert.alert(
            'Sharing unavailable',
            'File sharing is not available on this device.'
        )
        return
        }

        await Sharing.shareAsync(uri, {
        mimeType,
        dialogTitle,
        UTI: mimeType === 'application/pdf'
            ? 'com.adobe.pdf'
            : undefined,
        })
    } catch (error) {
        console.error('Share error:', error)

        Alert.alert(
        'Share Error',
        error?.message || 'Unable to share the file.'
        )
    }
    }


  // =========================================================
  // PRINT / PDF
  // =========================================================

  const buildPdfHtml = () => {
    const rows = bills
      .map(
        (bill, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${bill?.tracking_no || ''}</td>
            <td>${getDescription(bill)}</td>
            <td>${formatWeight(bill)}</td>
            <td>${bill?.destiny_branch?.code || '-'}</td>
          </tr>
        `
      )
      .join('')

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />

          <style>
            @page {
              size: A4;
              margin: 20px;
            }

            body {
              font-family: Arial, sans-serif;
              color: #055dff;
              margin: 0;
              padding: 0;
            }

            .header {
              border: 2px solid #055dff;
              border-radius: 8px;
              padding: 15px 20px;
              margin-bottom: 20px;
            }

            .header-row {
              display: flex;
              align-items: center;
            }

            .logo-container {
              width: 110px;
            }

            .logo {
              width: 90px;
              height: 90px;
              object-fit: contain;
            }

            .company-details {
              flex: 1;
              text-align: center;
            }

            .company-title {
              margin: 0;
              font-size: 30px;
              font-weight: bold;
            }

            .company-header-2 {
              font-size: 20px;
              margin-top: 4px;
              font-weight: 600;
            }

            .company-header-3 {
              font-size: 16px;
              color: #444;
              margin-top: 3px;
            }

            .right-details {
              width: 220px;
              text-align: right;
              font-size: 13px;
              line-height: 1.6;
            }

            .divider {
              border: none;
              border-top: 2px solid #055dff;
              margin: 15px 0;
            }

            .report-title {
              text-align: center;
              font-size: 22px;
              font-weight: bold;
              letter-spacing: 2px;
              text-transform: uppercase;
            }

            .information {
              display: flex;
              justify-content: space-between;
              margin-top: 15px;
              font-size: 15px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              border: 2px solid #000;
            }

            th {
              background-color: #055dff;
              color: white;
              border: 1px solid #000;
              padding: 8px;
              text-align: center;
            }

            td {
              border: 1px solid #000;
              padding: 8px;
              color: #055dff;
            }

            .footer {
              display: flex;
              justify-content: space-between;
              margin-top: 12px;
              font-size: 14px;
              font-weight: bold;
            }
          </style>
        </head>

        <body>
          <div class="header">

            <div class="header-row">

              ${
                logoUri
                  ? `
                    <div class="logo-container">
                      <img
                        class="logo"
                        src="${logoUri}"
                      />
                    </div>
                  `
                  : `
                    <div class="logo-container"></div>
                  `
              }

              <div class="company-details">

                <div class="company-title">
                  ${company?.header_1 || ''}
                </div>

                <div class="company-header-2">
                  ${company?.header_2 || ''}
                </div>

                <div class="company-header-3">
                  ${company?.header_3 || ''}
                </div>

              </div>

              <div class="right-details">

                <div>
                  <strong>Date:</strong> ${dayInput}
                </div>

                <div>
                  <strong>Company:</strong> ${company?.name || ''}
                </div>

                <div>
                  <strong>Phone:</strong> ${company?.phone || ''}
                </div>

                <div>
                  <strong>Country:</strong> ${company?.country || ''}
                </div>

                <div>
                  <strong>Code:</strong> ${company?.short_code || ''}
                </div>

              </div>

            </div>

            <hr class="divider" />

            <div class="report-title">
              ${company?.table_title || ''}
            </div>

            <div class="information">

              <div>
                <strong>Total Bills:</strong>
                ${bills.length}
              </div>

              <div>
                <strong>Total Weight:</strong>
                ${totalWeight.toFixed(2)} Kg
              </div>

              <div>
                <strong>Printed:</strong>
                ${dayInput}
              </div>

            </div>

          </div>

          <table>

            <thead>
              <tr>
                <th>#</th>
                <th>Tracking No</th>
                <th>Description</th>
                <th>Weight (Kg)</th>
                <th>Destination</th>
              </tr>
            </thead>

            <tbody>
              ${rows}
            </tbody>

          </table>

          <div class="footer">
            <div>${company?.footer_1 || ''}</div>
            <div>ቀን፡ ${dayInput}</div>
          </div>

        </body>
      </html>
    `
  }

  const handlePrint = async () => {
    if (!bills.length) {
      Alert.alert('No bills', 'There are no bills to print.')
      return
    }

    try {
      setExporting(true)

      const html = buildPdfHtml()

      await Print.printAsync({
        html,
      })
    } catch (err) {
      console.error('Print error:', err)

      Alert.alert(
        'Print Error',
        'Unable to print the selected bills.'
      )
    } finally {
      setExporting(false)
    }
  }
  const getFileName = async (defaultName = 'Selected_Bills') => {
    if (Platform.OS !== 'ios') {
        return defaultName
    }

    return new Promise((resolve) => {
        Alert.prompt(
        'File name',
        'Enter file name:',
        [
            {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(null),
            },
            {
            text: 'OK',
            onPress: (value) => {
                resolve(value?.trim() || defaultName)
            },
            },
        ],
        'plain-text',
        defaultName
        )
    })
    }





  // =========================================================
  // PDF DOWNLOAD / SHARE
  // =========================================================

  const downloadPDF = async () => {
    if (!bills.length) {
        Alert.alert(
        'No bills',
        'There are no bills to export.'
        )
        return
    }

    try {
        setExporting(true)

        const fileName = await getFileName(
        `${company?.name || 'Selected_Bills'} ${dayInput}`
        )

        // User cancelled
        if (!fileName) {
        return
        }

        const safeName = sanitizeFileName(
        fileName,
        'Selected_Bills'
        )

        const html = buildPdfHtml()

        // =====================================================
        // Generate PDF as BASE64
        // =====================================================

        const result = await Print.printToFileAsync({
        html,
        base64: true,
        })

        console.log(
        'PDF generated. URI:',
        result.uri
        )

        if (!result.base64) {
        throw new Error(
            'PDF base64 data was not returned.'
        )
        }

        // =====================================================
        // Write our own PDF file
        // =====================================================

        const fileUri =
        `${LegacyFileSystem.cacheDirectory}${safeName}.pdf`

        // Delete old file if it exists
        const existing =
        await LegacyFileSystem.getInfoAsync(fileUri)

        if (existing.exists) {
        await LegacyFileSystem.deleteAsync(
            fileUri,
            {
            idempotent: true,
            }
        )
        }

        // Write base64 directly to our cache file
        await LegacyFileSystem.writeAsStringAsync(
        fileUri,
        result.base64,
        {
            encoding:
            LegacyFileSystem.EncodingType.Base64,
        }
        )

        console.log(
        'PDF saved:',
        fileUri
        )

        // =====================================================
        // Verify our file
        // =====================================================

        const info =
        await LegacyFileSystem.getInfoAsync(
            fileUri
        )

        console.log(
        'PDF info:',
        info
        )

        if (!info.exists) {
        throw new Error(
            'PDF file was not created.'
        )
        }

        // =====================================================
        // Share
        // =====================================================

        await Sharing.shareAsync(
        fileUri,
        {
            mimeType: 'application/pdf',
            dialogTitle: 'Share PDF',
            UTI:
            Platform.OS === 'ios'
                ? 'com.adobe.pdf'
                : undefined,
        }
        )
    } catch (err) {
        console.error(
        'PDF export error:',
        err
        )

        Alert.alert(
        'PDF Error',
        err?.message ||
            'Unable to create or share the PDF file.'
        )
    } finally {
        setExporting(false)
    }
    }










  // =========================================================
  // IMAGE EXPORT
  // =========================================================

  const downloadImage = async () => {
    if (!printRef.current) {
        Alert.alert(
        'Image Error',
        'Printable view is not ready.'
        )
        return
    }

    try {
        setExporting(true)

        const fileName = await getFileName(
        `${company?.name || 'Selected_Bills'} ${dayInput}`
        )

        // User pressed Cancel on iOS
        if (!fileName) {
        return
        }

        const safeName = sanitizeFileName(
        fileName,
        'Selected_Bills'
        )

        const tempUri = await captureRef(
        printRef.current,
        {
            format: 'png',
            quality: 0.9,
            result: 'tmpfile',
        }
        )

        console.log('Temporary image:', tempUri)

        const targetUri =
        `${LegacyFileSystem.cacheDirectory}${safeName}.png`

        await LegacyFileSystem.copyAsync({
        from: tempUri,
        to: targetUri,
        })

        console.log('Image copied to:', targetUri)

        await shareFile(
        targetUri,
        'image/png',
        'Share Image'
        )
    } catch (err) {
        console.error(
        'Image export error:',
        err
        )

        Alert.alert(
        'Image Error',
        err?.message ||
            'Unable to create the image.'
        )
    } finally {
        setExporting(false)
    }
    }




  // =========================================================
  // EXCEL EXPORT
  // =========================================================

  const applyExcelHeader = (ws, title) => {
    ws['A1'] = {
      v: company?.header_1 || '',
      s: {
        font: {
          name: 'Cambria',
          sz: 16,
          bold: true,
        },
      },
    }

    ws['A2'] = {
      v: company?.header_2 || '',
      s: {
        font: {
          name: 'Cambria',
          sz: 14,
          bold: true,
        },
      },
    }

    ws['A3'] = {
      v: company?.header_3 || '',
      s: {
        font: {
          name: 'Cambria',
          sz: 12,
          bold: true,
        },
      },
    }

    ws['C4'] = {
      v: `ቀን ${dayInput}`,
      s: {
        font: {
          name: 'Cambria',
          sz: 14,
          bold: true,
        },
      },
    }

    ws['A5'] = {
      v: title,
      s: {
        font: {
          name: 'Cambria',
          sz: 12,
          bold: true,
        },
      },
    }

    ws['B6'] = {
      v: 'M.AWB',
      s: {
        font: {
          name: 'Cambria',
          sz: 11,
          bold: true,
        },
      },
    }
  }

  const buildExcelSheet = (data, title) => {
    const worksheetData = []

    worksheetData.push([
      company?.header_1 || '',
    ])

    worksheetData.push([
      company?.header_2 || '',
    ])

    worksheetData.push([
      company?.header_3 || '',
    ])

    worksheetData.push([
      '',
      '',
      `ቀን ${dayInput}`,
    ])

    worksheetData.push([
      title,
    ])

    worksheetData.push([
      '',
      'M.AWB',
    ])

    worksheetData.push([
      'NO',
      'COU AWB',
      'Item DESCRIPTION',
      'GROWS WEIGHT (KG)',
      'Destination',
    ])

    data.forEach((bill, index) => {
      worksheetData.push([
        index + 1,
        bill?.tracking_no || '',
        getDescription(bill),
        Number(formatWeight(bill)),
        bill?.destiny_branch?.code || '-',
      ])
    })

    worksheetData.push([])

    worksheetData.push([
      company?.footer_1 || '',
      '',
      '',
      '',
      `ቀን፡ ${dayInput}`,
    ])

    const ws = XLSX.utils.aoa_to_sheet(worksheetData)

    ws['!cols'] = [
      { wch: 8 },
      { wch: 20 },
      { wch: 35 },
      { wch: 22 },
      { wch: 18 },
    ]

    // -------------------------------------------------------
    // Basic styling
    // -------------------------------------------------------

    const range = XLSX.utils.decode_range(ws['!ref'])

    for (let row = range.s.r; row <= range.e.r; row++) {
      for (
        let col = range.s.c;
        col <= range.e.c;
        col++
      ) {
        const address = XLSX.utils.encode_cell({
          r: row,
          c: col,
        })

        if (!ws[address]) continue

        ws[address].s = {
          font: {
            name: 'Cambria',
            sz: 11,
          },
          alignment: {
            vertical: 'center',
          },
        }
      }
    }

    // Header rows
    for (let row = 0; row < 7; row++) {
      const firstCell = XLSX.utils.encode_cell({
        r: row,
        c: 0,
      })

      if (ws[firstCell]) {
        ws[firstCell].s = {
          font: {
            name: 'Cambria',
            sz:
              row === 0
                ? 16
                : row === 1
                ? 14
                : row === 2
                ? 12
                : 11,
            bold: true,
          },
        }
      }
    }

    // Table header
    for (let col = 0; col < 5; col++) {
      const address = XLSX.utils.encode_cell({
        r: 6,
        c: col,
      })

      if (ws[address]) {
        ws[address].s = {
          font: {
            name: 'Cambria',
            sz: 11,
            bold: true,
          },
          fill: {
            fgColor: {
              rgb: 'FFFF00',
            },
          },
          border: {
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
          },
        }
      }
    }

    // Table body
    for (
      let row = 7;
      row < 7 + data.length;
      row++
    ) {
      for (let col = 0; col < 5; col++) {
        const address = XLSX.utils.encode_cell({
          r: row,
          c: col,
        })

        if (!ws[address]) continue

        ws[address].s = {
          font: {
            name: 'Cambria',
            sz: 11,
          },
          border: {
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
          },
        }
      }
    }

    return ws
  }



  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>
          Loading...
        </Text>
      </View>
    )
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {error}
        </Text>
      </View>
    )
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <View style={styles.container}>

      {/* ===================================================
          ACTION BUTTONS
      =================================================== */}

      <View style={styles.actionContainer}>

        <TouchableOpacity
          style={[
            styles.button,
            styles.printButton,
          ]}
          onPress={handlePrint}
          disabled={exporting}
        >
          <Text style={styles.buttonText}>
            🖨 Print
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.pdfButton,
          ]}
          onPress={downloadPDF}
          disabled={exporting}
        >
          <Text style={styles.buttonText}>
            📄 PDF
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.excelButton,
          ]}
          onPress={()=> downloadExcel(bills, setExporting, getFileName, company, dayInput, totalWeight, shareFile)}
          disabled={exporting}
        >
          <Text style={styles.buttonText}>
            📊 Excel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.imageButton,
          ]}
          onPress={downloadImage}
          disabled={exporting}
        >
          <Text style={styles.buttonText}>
            🖼 Image
          </Text>
        </TouchableOpacity>

        <TextInput
          value={dayInput}
          onChangeText={setDayInput}
          placeholder="Enter Day"
          style={styles.dateInput}
        />

      </View>

      {exporting && (
        <Text style={styles.exportingText}>
          Preparing file...
        </Text>
      )}

      {/* ===================================================
          PRINTABLE CONTENT
      =================================================== */}

        <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
        >
            <ScrollView
                horizontal={true}
                showsHorizontalScrollIndicator={true}
                nestedScrollEnabled={true}
            >

            <View
            ref={printRef}
            collapsable={false}
            style={styles.printContainer}
            >

            {/* =================================================
                COMPANY HEADER
            ================================================= */}

            <View style={styles.companyBox}>

                <View style={styles.headerRow}>

                {/* Logo */}

                <View style={styles.logoContainer}>

                    {logoUri ? (
                    <Image
                        source={{
                        uri: logoUri,
                        }}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    ) : null}

                </View>

                {/* Company details */}

                <View
                    style={styles.companyDetails}
                >

                    <Text
                    style={styles.companyTitle}
                    >
                    {company?.header_1 || ''}
                    </Text>

                    <Text
                    style={styles.companyHeader2}
                    >
                    {company?.header_2 || ''}
                    </Text>

                    <Text
                    style={styles.companyHeader3}
                    >
                    {company?.header_3 || ''}
                    </Text>

                </View>

                {/* Right side */}

                <View
                    style={styles.rightDetails}
                >

                    <Text style={styles.detailText}>
                    <Text style={styles.bold}>
                        Date:
                    </Text>{' '}
                    {dayInput}
                    </Text>

                    <Text style={styles.detailText}>
                    <Text style={styles.bold}>
                        Company:
                    </Text>{' '}
                    {company?.name || ''}
                    </Text>

                    <Text style={styles.detailText}>
                    <Text style={styles.bold}>
                        Phone:
                    </Text>{' '}
                    {company?.phone || ''}
                    </Text>

                    <Text style={styles.detailText}>
                    <Text style={styles.bold}>
                        Country:
                    </Text>{' '}
                    {company?.country || ''}
                    </Text>

                    <Text style={styles.detailText}>
                    <Text style={styles.bold}>
                        Code:
                    </Text>{' '}
                    {company?.short_code || ''}
                    </Text>

                </View>

                </View>

                {/* Divider */}

                <View style={styles.divider} />

                {/* Report title */}

                <Text
                style={styles.reportTitle}
                >
                {company?.table_title || ''}
                </Text>

                {/* Information */}

                <View style={styles.informationRow}>

                <Text style={styles.infoText}>
                    <Text style={styles.bold}>
                    Total Bills:
                    </Text>{' '}
                    {bills.length}
                </Text>

                <Text style={styles.infoText}>
                    <Text style={styles.bold}>
                    Total Weight:
                    </Text>{' '}
                    {totalWeight.toFixed(2)} Kg
                </Text>

                <Text style={styles.infoText}>
                    <Text style={styles.bold}>
                    Printed:
                    </Text>{' '}
                    {dayInput}
                </Text>

                </View>

            </View>

            {/* =================================================
                TABLE
            ================================================= */}

            <View style={styles.table}>

                {/* Header */}

                <View style={styles.tableHeader}>

                <View
                    style={[
                    styles.cell,
                    styles.numberCell,
                    styles.headerCell,
                    ]}
                >
                    <Text
                    style={styles.headerText}
                    >
                    #
                    </Text>
                </View>

                <View
                    style={[
                    styles.cell,
                    styles.trackingCell,
                    styles.headerCell,
                    ]}
                >
                    <Text
                    style={styles.headerText}
                    >
                    Tracking No
                    </Text>
                </View>

                <View
                    style={[
                    styles.cell,
                    styles.descriptionCell,
                    styles.headerCell,
                    ]}
                >
                    <Text
                    style={styles.headerText}
                    >
                    Description
                    </Text>
                </View>

                <View
                    style={[
                    styles.cell,
                    styles.weightCell,
                    styles.headerCell,
                    ]}
                >
                    <Text
                    style={styles.headerText}
                    >
                    Weight (Kg)
                    </Text>
                </View>

                <View
                    style={[
                    styles.cell,
                    styles.destinationCell,
                    styles.headerCell,
                    ]}
                >
                    <Text
                    style={styles.headerText}
                    >
                    Destination
                    </Text>
                </View>

                </View>

                {/* Data */}

                {bills.map((bill, index) => (
                <View
                    key={
                    bill?.id ||
                    bill?.tracking_no ||
                    index
                    }
                    style={styles.tableRow}
                >

                    <View
                    style={[
                        styles.cell,
                        styles.numberCell,
                    ]}
                    >
                    <Text style={styles.cellText}>
                        {index + 1}
                    </Text>
                    </View>

                    <View
                    style={[
                        styles.cell,
                        styles.trackingCell,
                    ]}
                    >
                    <Text style={styles.cellText}>
                        {bill?.tracking_no || ''}
                    </Text>
                    </View>

                    <View
                    style={[
                        styles.cell,
                        styles.descriptionCell,
                    ]}
                    >
                    <Text style={styles.cellText}>
                        {getDescription(bill)}
                    </Text>
                    </View>

                    <View
                    style={[
                        styles.cell,
                        styles.weightCell,
                    ]}
                    >
                    <Text style={styles.cellText}>
                        {formatWeight(bill)}
                    </Text>
                    </View>

                    <View
                    style={[
                        styles.cell,
                        styles.destinationCell,
                    ]}
                    >
                    <Text style={styles.cellText}>
                        {bill?.destiny_branch?.code ||
                        '-'}
                    </Text>
                    </View>

                </View>
                ))}

            </View>

            {/* =================================================
                FOOTER
            ================================================= */}

            <View style={styles.footer}>

                <Text style={styles.footerText}>
                {company?.footer_1 || ''}
                </Text>

                <Text style={styles.footerText}>
                ቀን፡ {dayInput}
                </Text>

            </View>

            </View>

        
            </ScrollView>
        </ScrollView>

    </View>
  )
}

// ===========================================================
// STYLES
// ===========================================================

const BLUE = '#055dff'
const BLACK = '#000000'
const WHITE = '#ffffff'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },

  loadingText: {
    color: BLUE,
    fontSize: 16,
  },

  errorContainer: {
    margin: 20,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#ffe5e5',
  },

  errorText: {
    color: '#d00000',
    fontSize: 15,
  },

  actionContainer: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: WHITE,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },

  button: {
    minWidth: 80,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  printButton: {
    backgroundColor: '#198754',
  },

  pdfButton: {
    backgroundColor: '#dc3545',
  },

  excelButton: {
    backgroundColor: '#0d6efd',
  },

  imageButton: {
    backgroundColor: '#ffc107',
  },

  buttonText: {
    color: WHITE,
    fontWeight: 'bold',
    fontSize: 13,
  },

  dateInput: {
    width: 110,
    height: 40,
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 6,
    paddingHorizontal: 10,
    backgroundColor: WHITE,
    color: '#222',
  },

  exportingText: {
    textAlign: 'center',
    paddingVertical: 8,
    color: BLUE,
    fontWeight: '600',
  },

  scrollContent: {
    padding: 15,
    paddingBottom: 50,
  },

  printContainer: {
    backgroundColor: WHITE,
    padding: 20,
    width: 900,
    alignSelf: 'flex-start',
    },
    verticalScroll: {
    flex: 1,
    },

    horizontalScroll: {
    flex: 1,
    },




  companyBox: {
    borderWidth: 2,
    borderColor: BLUE,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logo: {
    width: 90,
    height: 90,
  },

  companyDetails: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },

  companyTitle: {
    color: BLUE,
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
  },

  companyHeader2: {
    color: BLUE,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },

  companyHeader3: {
    color: '#444',
    fontSize: 14,
    marginTop: 3,
    textAlign: 'center',
  },

  rightDetails: {
    width: 190,
    alignItems: 'flex-end',
  },

  detailText: {
    color: '#333',
    fontSize: 12,
    lineHeight: 19,
  },

  bold: {
    fontWeight: 'bold',
  },

  divider: {
    height: 2,
    backgroundColor: BLUE,
    marginVertical: 15,
  },

  reportTitle: {
    color: BLUE,
    fontSize: 21,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
  },

  informationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },

  infoText: {
    color: BLUE,
    fontSize: 14,
  },

  table: {
    width: '100%',
    borderWidth: 2,
    borderColor: BLACK,
  },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BLUE,
  },

  tableRow: {
    flexDirection: 'row',
  },

  cell: {
    minHeight: 38,
    paddingHorizontal: 7,
    paddingVertical: 8,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: BLACK,
    justifyContent: 'center',
  },

  headerCell: {
    backgroundColor: BLUE,
    borderColor: BLACK,
  },

  headerText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  cellText: {
    color: BLUE,
    fontSize: 12,
  },

  numberCell: {
    width: 50,
    alignItems: 'center',
  },

  trackingCell: {
    width: 150,
  },

  descriptionCell: {
    flex: 1,
    minWidth: 220,
  },

  weightCell: {
    width: 110,
    alignItems: 'center',
  },

  destinationCell: {
    width: 110,
  },

  footer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  footerText: {
    color: BLUE,
    fontSize: 13,
    fontWeight: 'bold',
  },
})

export default CustomCommissionPrint

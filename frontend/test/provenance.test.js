import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { fetchAnomalies, fetchAnomaliesForAtm, queryAnomalies } from '../src/services/anomalyService.js'
import { fetchDashboardOverview } from '../src/services/dashboardService.js'
import { fetchTransactions, queryTransactions } from '../src/services/transactionService.js'
import { fetchReportOverview, requestReportExport, requestTransactionExport } from '../src/services/reportService.js'
import { deriveAnalytics, fetchAnalyticsDataset } from '../src/services/analyticsService.js'
import { clearMlRecordCache, loadMlRecords } from '../src/services/mlDataAdapter.js'
import { SYNTHETIC_MALAWI_DATASET } from '../src/config/geography.js'
import { isDemonstrationFlaggedTransaction } from '../src/utils/demonstrationRule.js'
import { TRANSACTION_RISK_OPTIONS } from '../src/utils/filters.js'

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]

    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (character === ',' && !quoted) {
      row.push(field)
      field = ''
    } else if ((character === '\r' || character === '\n') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += character
    }
  }

  if (quoted) throw new Error('CSV contains an unterminated quoted field.')
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

test('full synthetic dataset uses shared Isolation Forest results and separate threshold flags', async () => {
  assert.equal(isDemonstrationFlaggedTransaction({ type: 'Cash withdrawal', amount: 99_999 }), false)
  assert.equal(isDemonstrationFlaggedTransaction({ type: 'Cash withdrawal', amount: 100_000 }), true)
  assert.equal(isDemonstrationFlaggedTransaction({ type: 'Deposit', amount: 1_000_000 }), false)

  const csv = await readFile(new URL('../public/data/malawi_anomaly_results.csv', import.meta.url), 'utf8')
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (path) => {
    assert.equal(path, SYNTHETIC_MALAWI_DATASET.sourcePath)
    return { ok: true, text: async () => csv }
  }
  clearMlRecordCache()
  try {
    const records = await loadMlRecords()
    assert.equal(records.length, 50_000)
    assert.equal(new Set(records.map((record) => record.id)).size, records.length)
    const modelAnomalyCount = records.filter((record) => record.isAnomaly).length
    assert.equal(modelAnomalyCount, 2_500)
    assert.ok(records.every((record) => Number.isFinite(record.modelAnomalyScore)))
    assert.ok(records.every((record) => record.modelIsAnomaly === record.isAnomaly))
    assert.ok(records.every((record) => record.anomalyScore === record.modelAnomalyScore))
    assert.ok(records.every((record) => record.modelPrediction === (record.isAnomaly ? 'Anomaly' : 'Normal')))
    assert.ok(records.every((record) => record.risk === record.modelRiskLevel))
    assert.ok(records.every((record) =>
      record.thresholdRuleFlagged === isDemonstrationFlaggedTransaction(record)))
    assert.ok(records.every((record) => record.data_source === 'SYNTHETIC_MALAWI_DEMONSTRATION'))
    assert.ok(records.every((record) => record.is_live_bank_data.toLowerCase() === 'false'))
    assert.ok(records.every((record) =>
      !('model_prediction' in record) &&
      !('model_anomaly_score' in record) &&
      !('model_is_anomaly' in record) &&
      !('model_risk_level' in record),
    ))
    assert.ok(records.filter((record) => record.isAnomaly).every((record) => record.detectionStatus === 'Flagged for Review'))
    assert.ok(records.filter((record) => !record.isAnomaly).every((record) => record.detectionStatus === 'Cleared'))
    const riskCounts = records.reduce((counts, record) => {
      counts[record.risk] = (counts[record.risk] ?? 0) + 1
      return counts
    }, {})
    assert.deepEqual(riskCounts, { Normal: 45_000, Low: 2_500, Medium: 2_000, High: 500 })
    assert.ok(
      Math.min(...records.filter((record) => record.isAnomaly).map((record) => record.anomalyScore)) >
      Math.max(...records.filter((record) => !record.isAnomaly).map((record) => record.anomalyScore)),
    )

    const transactions = await fetchTransactions()
    const anomalies = await fetchAnomalies()
    const atmFlags = await fetchAnomaliesForAtm(records[0].atmId)
    const dashboard = await fetchDashboardOverview()
    const reports = await fetchReportOverview('all')
    const analyticsData = await fetchAnalyticsDataset()
    assert.equal(transactions.records.length, records.length)
    assert.equal(anomalies.summary.total, records.length)
    assert.equal(anomalies.summary.flagged, records.filter((record) => record.isAnomaly).length)
    assert.ok(atmFlags.every((record) => record.atmId === records[0].atmId && record.isAnomaly))
    assert.equal(dashboard.kpis.find((item) => item.id === 'total').value, records.length)
    assert.equal(dashboard.kpis.find((item) => item.id === 'anomalies').value, anomalies.summary.flagged)
    assert.equal(dashboard.kpis.find((item) => item.id === 'withdrawal-total').value,
      records.filter((record) => record.type === 'Cash withdrawal').reduce((sum, record) => sum + record.amount, 0))
    assert.equal(reports.summary.totalTransactions, 50_000)
    assert.equal(reports.summary.totalAnomalies, modelAnomalyCount)
    assert.equal(reports.summary.thresholdRuleFlags, records.filter((record) => record.thresholdRuleFlagged).length)
    const sourceTimestampMs = (timestamp) => {
      const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(timestamp)
      const [, year, month, day, hour, minute, second = '0'] = match
      return Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second))
    }
    const latestTimestamp = Math.max(...records.map((record) => sourceTimestampMs(record.timestamp)))
    for (const [range, hours] of [['24h', 24], ['7d', 24 * 7]]) {
      const expectedRecords = records.filter((record) =>
        sourceTimestampMs(record.timestamp) >= latestTimestamp - hours * 60 * 60 * 1000,
      )
      const report = await fetchReportOverview(range)
      assert.equal(report.summary.totalTransactions, expectedRecords.length)
      assert.deepEqual(
        report.summary.dailySummaries.flatMap((day) => Array(day.transactions).fill(day.date)).sort(),
        expectedRecords.map((record) => record.timestamp.slice(0, 10)).sort(),
      )
    }

    const highRiskTransactions = queryTransactions(records, { filters: { risk: 'High' } }).records
    const mediumRiskTransactions = queryTransactions(records, { filters: { risk: 'Medium' } }).records
    const lowRiskTransactions = queryTransactions(records, { filters: { risk: 'Low' } }).records
    const normalTransactions = queryTransactions(records, { filters: { risk: 'Normal' } }).records
    assert.deepEqual(
      TRANSACTION_RISK_OPTIONS.map((option) => option.value),
      ['all', 'High', 'Medium', 'Low', 'Normal'],
    )
    assert.equal(highRiskTransactions.length, records.filter((record) => record.risk === 'High').length)
    assert.equal(mediumRiskTransactions.length, records.filter((record) => record.risk === 'Medium').length)
    assert.equal(lowRiskTransactions.length, records.filter((record) => record.risk === 'Low').length)
    assert.equal(normalTransactions.length, records.filter((record) => record.risk === 'Normal').length)
    assert.ok(highRiskTransactions.every((record) => record.isAnomaly))
    assert.ok(mediumRiskTransactions.every((record) => record.isAnomaly))
    assert.ok(lowRiskTransactions.every((record) => record.risk === 'Low' && !record.isAnomaly))
    assert.ok(normalTransactions.every((record) => !record.isAnomaly))
    for (const status of [...new Set(records.map((record) => record.transactionStatus))]) {
      const matching = queryTransactions(records, { filters: { status } }).records
      assert.ok(matching.every((record) => record.transactionStatus === status))
      assert.equal(matching.length, records.filter((record) => record.transactionStatus === status).length)
    }
    assert.equal(queryAnomalies(records, {
      filters: { status: 'Flagged for Review' },
    }).records.length, modelAnomalyCount)
    assert.equal(queryAnomalies(records, {
      filters: { status: 'Cleared' },
    }).records.length, 0)

    const allAnomalyRows = records.filter((record) => record.isAnomaly)
    const firstAnomaly = allAnomalyRows[0]
    for (const query of [firstAnomaly.id, firstAnomaly.atmId, firstAnomaly.location]) {
      const matching = queryAnomalies(records, { filters: { query } }).records
      assert.ok(matching.length > 0)
      assert.ok(matching.every((record) =>
        [record.id, record.atmId, record.location].some((value) =>
          value.toLowerCase().includes(query.toLowerCase()),
        ),
      ))
    }

    for (const [filter, predicate] of [
      [{ atmId: firstAnomaly.atmId }, (record) => record.atmId === firstAnomaly.atmId],
      [{ location: firstAnomaly.location }, (record) => record.location === firstAnomaly.location],
    ]) {
      const matching = queryAnomalies(records, { filters: filter }).records
      assert.ok(matching.length > 0)
      assert.ok(matching.every(predicate))
    }

    for (const risk of ['High', 'Medium', 'Low']) {
      const matching = queryAnomalies(records, { filters: { risk } }).records
      assert.ok(matching.every((record) => record.risk === risk && record.isAnomaly))
    }
    assert.deepEqual(
      allAnomalyRows.reduce((counts, record) => {
        counts[record.risk] = (counts[record.risk] ?? 0) + 1
        return counts
      }, {}),
      { High: 500, Medium: 2_000 },
    )

    const anomalyLatestTimestamp = Math.max(
      ...records.map((record) => new Date(record.timestamp).getTime()),
    )
    for (const [timeframe, hours] of [['24h', 24], ['7d', 168], ['14d', 336]]) {
      const matching = queryAnomalies(records, {
        filters: { timeframe },
      }).records
      const expected = allAnomalyRows.filter((record) =>
        new Date(record.timestamp).getTime() >= anomalyLatestTimestamp - hours * 60 * 60 * 1000,
      )
      assert.deepEqual(
        matching.map((record) => record.id).sort(),
        expected.map((record) => record.id).sort(),
      )
    }

    for (const [sort, accessor, direction] of [
      ['timestamp-asc', (record) => new Date(record.timestamp).getTime(), 1],
      ['timestamp-desc', (record) => new Date(record.timestamp).getTime(), -1],
      ['score-asc', (record) => record.anomalyScore, 1],
      ['score-desc', (record) => record.anomalyScore, -1],
      ['risk-desc', (record) => ({ Low: 1, Medium: 2, High: 3 })[record.risk], -1],
    ]) {
      const sorted = queryAnomalies(records, { sort }).records
      assert.ok(sorted.every((record, index) =>
        index === 0 || (accessor(sorted[index - 1]) - accessor(record)) * direction <= 0,
      ), `${sort} should sort the model-flagged results in the selected order`)
    }

    const amountAscending = queryTransactions(records, { sort: 'amount-asc' }).records
    const amountDescending = queryTransactions(records, { sort: 'amount-desc' }).records
    assert.ok(amountAscending.every((record, index, sorted) =>
      index === 0 || sorted[index - 1].amount <= record.amount))
    assert.ok(amountDescending.every((record, index, sorted) =>
      index === 0 || sorted[index - 1].amount >= record.amount))

    const sevenDayTransactions = queryTransactions(records, {
      filters: { timeframe: '7d' },
    }).records
    const sevenDayFlags = queryAnomalies(records, {
      filters: { timeframe: '7d' },
    }).records
    assert.deepEqual(
      sevenDayFlags.map((record) => record.id).sort(),
      sevenDayTransactions.filter((record) => record.isAnomaly).map((record) => record.id).sort(),
    )

    const analytics = deriveAnalytics({
      transactions: analyticsData.transactions,
      anomalies: analyticsData.anomalies,
      filters: { period: 'all' },
    })
    assert.equal(analytics.filteredCounts.transactions, records.length)
    assert.equal(analytics.filteredCounts.anomalies, modelAnomalyCount)
    assert.equal(analytics.amountDistribution.reduce((sum, item) => sum + item.Normal + item.Anomalous, 0), records.length)
    assert.equal(analytics.hourDistribution.reduce((sum, item) => sum + item.Normal + item.Anomalous, 0), records.length)
    assert.equal(analytics.byAtm.reduce((sum, item) => sum + item.anomalies, 0), modelAnomalyCount)
    assert.equal(analytics.scoreDistribution.reduce((sum, item) => sum + item.Normal + item.Anomalous, 0), records.length)
    const fourteenDayAnalytics = deriveAnalytics({
      transactions: analyticsData.transactions,
      anomalies: analyticsData.anomalies,
      filters: { period: '14d' },
    })
    assert.ok(fourteenDayAnalytics.filteredCounts.transactions <= records.length)
    assert.equal(
      fourteenDayAnalytics.filteredCounts.anomalies,
      fourteenDayAnalytics.byAtm.reduce((sum, item) => sum + item.anomalies, 0),
    )

    const transactionCsv = await requestTransactionExport('all')
    const anomalyCsv = await requestTransactionExport('all', true)
    const reportCsv = await requestReportExport('csv', 'all', 'Daily Observation Report')
    assert.match(transactionCsv, /Transaction ID,ATM ID,Transaction type,Amount \(MWK\),Date \/ time/)
    assert.match(transactionCsv, /Isolation Forest prediction,Isolation Forest anomaly score,Model risk level/)
    assert.equal(transactionCsv.trim().split('\r\n').length, records.length + 1)
    assert.equal(anomalyCsv.trim().split('\r\n').length, modelAnomalyCount + 1)
    assert.match(anomalyCsv, /Isolation Forest prediction,Isolation Forest anomaly score/)
    assert.match(reportCsv, /Report type,Daily Observation Report/)
    assert.match(reportCsv, new RegExp(`Isolation Forest model-flagged anomalies,${modelAnomalyCount}`))
    assert.ok(reportCsv.includes(
      `"MWK 100,000 threshold-rule flags (separate comparison)",${reports.summary.thresholdRuleFlags}`,
    ))
    assert.match(reportCsv, /Isolation Forest anomaly score/)
    assert.doesNotMatch(
      reportCsv,
      /fraud probability/i,
    )
    const escapedReport = await requestReportExport('csv', 'all', 'Audit, "quoted"\r\nreport')
    assert.ok(escapedReport.includes('"Audit, ""quoted""\r\nreport"'))
    assert.deepEqual(parseCsv(escapedReport)[1], ['Report type', 'Audit, "quoted"\r\nreport'])
    const reportSections = {
      'Daily Observation Report': 'Daily transaction and model-anomaly totals',
      'Anomaly Detection Report': 'Highest-scoring Isolation Forest anomalies (top 100)',
      'ATM Activity Report': 'Transaction and model anomalies by simulated ATM',
      'Risk Summary Report': 'Isolation Forest risk-level distribution',
    }
    for (const [reportName, sectionTitle] of Object.entries(reportSections)) {
      const generatedReport = await requestReportExport('csv', 'all', reportName)
      assert.ok(generatedReport.includes(`Report type,${reportName}`))
      assert.ok(generatedReport.includes(`Report-specific section,${sectionTitle}`))
      assert.match(generatedReport, new RegExp(`Isolation Forest model-flagged anomalies,${modelAnomalyCount}`))
      assert.match(generatedReport, /Isolation Forest anomaly score/)
    }

    for (const [range, hours] of [['24h', 24], ['7d', 168], ['all', null]]) {
      const expectedRecords = hours === null
        ? records
        : records.filter((record) =>
            sourceTimestampMs(record.timestamp) >= latestTimestamp - hours * 60 * 60 * 1000,
          )
      const expectedAnomalies = expectedRecords.filter((record) => record.isAnomaly)
      const transactionRows = parseCsv(await requestTransactionExport(range))
      const anomalyRows = parseCsv(await requestTransactionExport(range, true))
      const transactionHeader = transactionRows[0]
      const transactionIdIndex = transactionHeader.indexOf('Transaction ID')
      const predictionIndex = transactionHeader.indexOf('Isolation Forest prediction')
      const scoreIndex = transactionHeader.indexOf('Isolation Forest anomaly score')
      assert.ok(records.some((record) => record.modelAnomalyScore < 0))
      assert.equal(transactionRows.length, expectedRecords.length + 1, `${range} transaction export row count`)
      assert.equal(anomalyRows.length, expectedAnomalies.length + 1, `${range} anomaly export row count`)
      assert.deepEqual(
        transactionRows.slice(1).map((row) => row[transactionIdIndex]).sort(),
        expectedRecords.map((record) => record.id).sort(),
      )
      assert.deepEqual(
        anomalyRows.slice(1).map((row) => row[0]).sort(),
        expectedAnomalies.map((record) => record.id).sort(),
      )
      assert.ok(transactionRows.slice(1).every((row) =>
        ['Anomaly', 'Normal'].includes(row[predictionIndex]) && Number.isFinite(Number(row[scoreIndex])),
      ))
      assert.ok(transactionRows.slice(1).some((row) => Number(row[scoreIndex]) < 0))
      assert.ok(anomalyRows.slice(1).every((row) => row[predictionIndex] === 'Anomaly'))

      const selectedReport = await fetchReportOverview(range)
      assert.equal(selectedReport.summary.totalTransactions, expectedRecords.length)
      assert.equal(selectedReport.summary.totalAnomalies, expectedAnomalies.length)
      for (const reportName of Object.keys(reportSections)) {
        const rows = parseCsv(await requestReportExport('csv', range, reportName))
        const metricHeaderIndex = rows.findIndex((row) => row[0] === 'Metric' && row[1] === 'Value')
        const metrics = new Map(rows.slice(metricHeaderIndex + 1).map((row) => [row[0], row[1]]))
        assert.equal(rows[1][1], reportName)
        assert.equal(metrics.get('Transactions'), String(expectedRecords.length), `${range} ${reportName} transaction total`)
        assert.equal(metrics.get('Isolation Forest model-flagged anomalies'), String(expectedAnomalies.length), `${range} ${reportName} anomaly total`)
        assert.equal(metrics.get('MWK 100,000 threshold-rule flags (separate comparison)'), String(selectedReport.summary.thresholdRuleFlags))
        assert.ok(rows.some((row) => row.includes(reportSections[reportName])))
        assert.ok(rows.some((row) => row.includes('Isolation Forest anomaly score')))
      }
    }
  } finally {
    globalThis.fetch = originalFetch
    clearMlRecordCache()
  }
})

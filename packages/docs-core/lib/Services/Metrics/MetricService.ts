import metrics from '@proton/metrics'
import { getBrowserForMetrics } from './getBrowserForMetrics'
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics'
import type { Api } from '@proton/shared/lib/interfaces'
import type { TelemetryDocsEvents, TelemetryDocsHomepageEvents } from '@proton/shared/lib/api/telemetry'
import { TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry'
import type { SuggestionSummaryType } from '@proton/docs-shared/lib/SuggestionType'
import { ConnectionCloseMetrics } from '../../Realtime/ConnectionCloseMetrics'
import type { ConnectionCloseReason } from '@proton/docs-proto'

const HEARTBEAT_INTERVAL = 60_000

type MetricSuggestionType = 'insertion' | 'replacement' | 'deletion' | 'formatting' | 'style' | 'other'

const SuggestionTypeToMetricSuggestionType: Record<SuggestionSummaryType, MetricSuggestionType> = {
  insert: 'insertion',
  delete: 'deletion',
  'property-change': 'style',
  split: 'insertion',
  join: 'deletion',
  'link-change': 'other',
  'style-change': 'style',
  replace: 'replacement',
  'add-link': 'other',
  'delete-link': 'other',
  'image-change': 'other',
  'insert-image': 'insertion',
  'delete-image': 'deletion',
  'indent-change': 'formatting',
  'insert-table': 'insertion',
  'delete-table': 'deletion',
  'insert-table-row': 'insertion',
  'duplicate-table-row': 'insertion',
  'delete-table-row': 'deletion',
  'insert-table-column': 'insertion',
  'delete-table-column': 'deletion',
  'duplicate-table-column': 'insertion',
  'block-type-change': 'other',
  'insert-divider': 'insertion',
  'delete-divider': 'deletion',
  'clear-formatting': 'style',
  'align-change': 'formatting',
}

type SuggestionResolution = 'accepted' | 'rejected'

type DocType = Parameters<(typeof metrics.docs_open_documents_heartbeat_total)['increment']>[0]['docType']

export class MetricService {
  private heartbeatInterval: NodeJS.Timeout | null = null

  constructor(
    private readonly api: Api,
    private docType: DocType,
  ) {}

  initialize(): void {
    this.heartbeat()

    this.heartbeatInterval = setInterval(() => {
      this.heartbeat()
    }, HEARTBEAT_INTERVAL)
  }

  heartbeat(): void {
    metrics.docs_open_documents_heartbeat_total.increment({
      browser: getBrowserForMetrics(),
      docType: this.docType,
    })
  }

  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
  }

  reportSuggestionsTelemetry(event: TelemetryDocsEvents): void {
    void sendTelemetryReport({
      api: this.api,
      measurementGroup: TelemetryMeasurementGroups.docsSuggestions,
      event: event,
      delay: false,
    })
  }

  reportFullyBlockingErrorModal(): void {
    metrics.docs_alert_modal_total.increment({})
  }

  reportSuggestionCreated(type?: SuggestionSummaryType): void {
    const metricType = type ? SuggestionTypeToMetricSuggestionType[type] : 'other'
    metrics.docs_suggestions_created_total.increment({ type: metricType })
  }

  reportSuggestionResolved(resolution: SuggestionResolution): void {
    metrics.docs_suggestions_resolved_total.increment({ type: resolution })
  }

  reportRealtimeDisconnect(reason: ConnectionCloseReason): void {
    let type = ConnectionCloseMetrics[reason.props.code]
    if (!type) {
      /** There is no 'other' option, so we use 'timeout' as a catch-all */
      type = 'timeout'
    }

    metrics.docs_realtime_disconnect_error_total.increment({ type })
  }

  reportHomepageTelemetry(event: TelemetryDocsHomepageEvents) {
    void sendTelemetryReport({
      api: this.api,
      measurementGroup: TelemetryMeasurementGroups.docsHomepage,
      event: event,
      delay: false,
    })
  }
}

/**
 * Single entry point for the data-access layer.
 *
 * Pages import the service they need from here, e.g.
 *   import { dashboardService } from '../services'
 */
export * as transactionService from './transactionService'
export * as anomalyService from './anomalyService'
export * as atmService from './atmService'
export * as analyticsService from './analyticsService'
export * as dashboardService from './dashboardService'
export * as mlService from './mlService'
export * as reportService from './reportService'
export { DATA_SOURCE, DataServiceError } from './apiClient'
export { SUPABASE_STATUS } from './supabaseClient'

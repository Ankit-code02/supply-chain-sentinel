
import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  TrendingDown,
} from 'lucide-react'
import type { InventoryItem, Shipment } from '../api/types'

type SimulatorPageProps = {
  inventory: InventoryItem[]
  shipments: Shipment[]
  loading: boolean
}

type Scenario = 'SUPPLIER_DELAY' | 'DEMAND_SPIKE' | 'COMBINED'

function formatNumber(value: number, digits = 1) {
  return value.toLocaleString('en-IN', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function SimulatorPage({
  inventory,
  shipments,
  loading,
}: SimulatorPageProps) {
  const [scenario, setScenario] = useState<Scenario>('SUPPLIER_DELAY')
  const [delayDays, setDelayDays] = useState(5)
  const [demandIncrease, setDemandIncrease] = useState(30)

  const results = useMemo(() => {
    const demandMultiplier = demandIncrease / 100
    const applyDemand = scenario !== 'SUPPLIER_DELAY'
    const applyDelay = scenario !== 'DEMAND_SPIKE'

    const items = inventory.map((item) => {
      const currentCoverage = Math.max(0, item.estimatedDaysOfStock)
      const projectedCoverage = applyDemand
        ? currentCoverage / (1 + demandMultiplier)
        : currentCoverage

      const effectiveLeadTime =
        item.leadTimeDays + (applyDelay ? delayDays : 0)

      const stockoutInDays = projectedCoverage
      const coverageGap = Math.max(0, effectiveLeadTime - projectedCoverage)

      const estimatedUnitCost = Math.max(0, item.unitCost ?? 0)
      const projectedOrderQuantity = Math.max(
        0,
        Math.ceil(
          item.reorderPoint * 2 -
            item.quantityOnHand +
            (applyDemand ? item.quantityOnHand * demandMultiplier : 0),
        ),
      )

      return {
        ...item,
        currentCoverage,
        projectedCoverage,
        effectiveLeadTime,
        stockoutInDays,
        coverageGap,
        projectedOrderQuantity,
        estimatedAdditionalCost: projectedOrderQuantity * estimatedUnitCost,
        atRisk: projectedCoverage < effectiveLeadTime,
      }
    })

    const atRiskItems = items.filter((item) => item.atRisk)

    const impactedShipments = applyDelay
      ? shipments.filter((shipment) =>
          ['PENDING', 'IN_TRANSIT', 'DELAYED'].includes(shipment.status),
        )
      : []

    return {
      items,
      atRiskItems,
      impactedShipments,
      additionalCost: atRiskItems.reduce(
        (total, item) => total + item.estimatedAdditionalCost,
        0,
      ),
    }
  }, [inventory, shipments, scenario, delayDays, demandIncrease])

  function resetScenario() {
    setScenario('SUPPLIER_DELAY')
    setDelayDays(5)
    setDemandIncrease(30)
  }

  return (
    <div className="simulator-page">
      <section className="simulator-hero">
        <div>
          <span className="eyebrow">
            <SlidersHorizontal size={13} /> SCENARIO LAB
          </span>
          <h1>Test the disruption.<br /><span>Prepare the response.</span></h1>
          <p>
            Explore potential supply interruptions using your current
            inventory and shipment data, without changing live records.
          </p>
        </div>

        <div className="simulator-hero-mark">
          <TrendingDown size={36} />
          <span>WHAT-IF ANALYSIS</span>
          <strong>Non-destructive simulation</strong>
        </div>
      </section>

      <div className="simulator-notice">
        <ShieldCheck size={18} />
        <div>
          <strong>Simulation only — live data remains unchanged</strong>
          <p>
            Results are estimates based on available records and the
            scenario settings below. They are not predictions or purchase orders.
          </p>
        </div>
      </div>

      <div className="simulator-layout">
        <section className="panel simulator-controls">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">SCENARIO CONFIGURATION</span>
              <h2>Configure disruption</h2>
              <p>Adjust the conditions to explore possible outcomes.</p>
            </div>
          </div>

          <label className="simulator-field-label" htmlFor="scenario-type">
            Disruption type
          </label>
          <select
            id="scenario-type"
            className="simulator-select"
            value={scenario}
            onChange={(event) => setScenario(event.target.value as Scenario)}
          >
            <option value="SUPPLIER_DELAY">Supplier / lead-time delay</option>
            <option value="DEMAND_SPIKE">Demand increase</option>
            <option value="COMBINED">Combined disruption</option>
          </select>

          {scenario !== 'DEMAND_SPIKE' && (
            <div className="simulator-slider-field">
              <div className="simulator-slider-heading">
                <label htmlFor="delay-days">Additional lead time</label>
                <strong>{delayDays} days</strong>
              </div>
              <input
                id="delay-days"
                type="range"
                min={1}
                max={30}
                value={delayDays}
                onChange={(event) => setDelayDays(Number(event.target.value))}
              />
              <div className="simulator-slider-scale">
                <span>1 day</span><span>30 days</span>
              </div>
            </div>
          )}

          {scenario !== 'SUPPLIER_DELAY' && (
            <div className="simulator-slider-field">
              <div className="simulator-slider-heading">
                <label htmlFor="demand-increase">Demand increase</label>
                <strong>+{demandIncrease}%</strong>
              </div>
              <input
                id="demand-increase"
                type="range"
                min={10}
                max={200}
                step={10}
                value={demandIncrease}
                onChange={(event) =>
                  setDemandIncrease(Number(event.target.value))
                }
              />
              <div className="simulator-slider-scale">
                <span>+10%</span><span>+200%</span>
              </div>
            </div>
          )}

          <div className="simulator-scenario-summary">
            <AlertTriangle size={17} />
            <p>
              {scenario === 'SUPPLIER_DELAY'
                ? `Model a ${delayDays}-day extension to supplier lead times.`
                : scenario === 'DEMAND_SPIKE'
                  ? `Model a ${demandIncrease}% increase in inventory demand.`
                  : `Model a ${delayDays}-day supplier delay alongside a ${demandIncrease}% demand increase.`}
            </p>
          </div>

          <button
            type="button"
            className="button button-secondary simulator-reset"
            onClick={resetScenario}
          >
            <RotateCcw size={15} /> Reset scenario
          </button>
        </section>

        <section className="simulator-results">
          <div className="simulator-results-heading">
            <div>
              <span className="eyebrow">PROJECTED EXPOSURE</span>
              <h2>Potential operational impact</h2>
            </div>
            <span className="status status-warning">SIMULATED</span>
          </div>

          {loading && inventory.length === 0 ? (
            <div className="panel empty-state">Loading live inventory data…</div>
          ) : inventory.length === 0 ? (
            <div className="panel empty-state">
              <AlertTriangle size={20} />
              <strong>Inventory data unavailable</strong>
              <span>Load inventory records to calculate scenario outcomes.</span>
            </div>
          ) : (
            <>
              <div className="simulator-metrics">
                <article className="metric-card">
                  <span className="metric-label">Items at coverage risk</span>
                  <strong className="metric-value">
                    {results.atRiskItems.length}
                  </strong>
                  <span className="metric-detail">
                    Of {inventory.length} tracked items
                  </span>
                </article>

                <article className="metric-card">
                  <span className="metric-label">Projected order estimate</span>
                  <strong className="metric-value simulator-cost">
                    {formatCurrency(results.additionalCost)}
                  </strong>
                  <span className="metric-detail">
                    Indicative, not a purchase order
                  </span>
                </article>

                <article className="metric-card">
                  <span className="metric-label">Potentially affected shipments</span>
                  <strong className="metric-value">
                    {results.impactedShipments.length}
                  </strong>
                  <span className="metric-detail">
                    Active shipment records in this scenario
                  </span>
                </article>
              </div>

              <section className="panel simulator-table-panel">
                <div className="panel-heading">
                  <div>
                    <span className="eyebrow">STOCK COVERAGE ANALYSIS</span>
                    <h2>Inventory scenario results</h2>
                  </div>
                  <span className="table-record-count">
                    {results.items.length} items
                  </span>
                </div>

                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ITEM</th>
                        <th>CURRENT COVERAGE</th>
                        <th>PROJECTED COVERAGE</th>
                        <th>SCENARIO LEAD TIME</th>
                        <th>EXPOSURE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.items.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <strong className="table-primary">{item.name}</strong>
                            <span className="table-secondary">{item.sku}</span>
                          </td>
                          <td>{formatNumber(item.currentCoverage)} days</td>
                          <td>
                            <strong>{formatNumber(item.projectedCoverage)} days</strong>
                            <span className="table-secondary">
                              {item.projectedCoverage < item.currentCoverage
                                ? `${formatNumber(item.currentCoverage - item.projectedCoverage)} days less`
                                : 'No coverage reduction'}
                            </span>
                          </td>
                          <td>{item.effectiveLeadTime} days</td>
                          <td>
                            <span
                              className={`status ${item.atRisk ? 'status-danger' : 'status-success'}`}
                            >
                              {item.atRisk ? 'AT RISK' : 'COVERED'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="panel simulator-recommendation">
                <span className="simulator-recommendation-icon">
                  {results.atRiskItems.length > 0
                    ? <AlertTriangle size={19} />
                    : <ShieldCheck size={19} />}
                </span>
                <div>
                  <span className="eyebrow">SCENARIO TAKEAWAY</span>
                  <h3>
                    {results.atRiskItems.length > 0
                      ? `${results.atRiskItems.length} item(s) may need attention`
                      : 'No coverage gaps identified in this scenario'}
                  </h3>
                  <p>
                    {results.atRiskItems.length > 0
                      ? 'Review exposed items, validate demand and supplier commitments, and assess contingency options before making operational changes.'
                      : 'The current model does not identify inventory coverage below the adjusted lead time. Continue monitoring live risks and supplier performance.'}
                  </p>
                </div>
                <ArrowRight size={17} />
              </section>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

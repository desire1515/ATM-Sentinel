import {
  BrainCircuit,
  CircleHelp,
  Gauge,
  Layers,
  RefreshCw,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react'
import PageContainer from '../components/layout/PageContainer'
import SectionHeader from '../components/common/SectionHeader'
import ErrorState from '../components/common/ErrorState'
import { Card, CardHeader } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { Badge } from '../components/common/Badge'
import MlPipeline from '../components/ml/MlPipeline'
import FeatureGrid from '../components/ml/FeatureGrid'
import ModelRunHistory from '../components/ml/ModelRunHistory'
import { useServiceQuery } from '../hooks/useServiceQuery'
import { mlService } from '../services'

const HOW_IT_WORKS = [
  {
    title: 'Prepare transaction features',
    body: 'Amounts, balances, transaction time, weekend, type and status are prepared; IDs and injected labels are excluded.',
  },
  {
    title: 'Train Isolation Forest',
    body: 'The Python script trains an unsupervised Isolation Forest on eligible synthetic transactions.',
  },
  {
    title: 'Read precomputed predictions',
    body: 'The model writes Anomaly / Normal predictions and decision scores to a CSV that the frontend reads.',
  },
  {
    title: 'Review unusual patterns',
    body: 'Anomaly flags are prompts for investigation, not confirmed fraud findings or fraud probabilities.',
  },
]

const RULE_NOTES = [
  'A fixed random seed makes regeneration reproducible for the same input and package versions.',
  'The model uses transaction amounts and balances, time patterns, weekend, type and status.',
  'Injected synthetic labels and transaction/account identifiers are never model features.',
  'The MWK 100,000 withdrawal rule is a separate comparison and does not determine model predictions.',
]

/**
 * Describes the precomputed Isolation Forest results used by this prototype.
 */
export function MlModel() {
  const { data, refreshing, error, refetch } = useServiceQuery(() => mlService.fetchModelOverview())

  const config = data?.config
  const status = data?.status

  return (
    <PageContainer className="space-y-5">
      <SectionHeader
        level={2}
        eyebrow="Detection method"
        title="Isolation Forest Anomaly Detection"
        description="Precomputed unsupervised Isolation Forest predictions are loaded from the synthetic Malawi results CSV. The browser does not train the model."
        actions={
          <>
            <Badge tone="warn" size="md">
              {status?.resultsAvailable ? 'Results available' : 'Awaiting results'}
            </Badge>
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              loading={refreshing}
              onClick={refetch}
            >
              Refresh
            </Button>
          </>
        }
      />

      {error ? (
        <ErrorState
          description="The precomputed model results could not be read."
          detail={error.message}
          onRetry={refetch}
        />
      ) : null}

      <section
        aria-label="Isolation Forest model summary"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <Card>
          <CardHeader
            title="Model"
            description="Unsupervised detection method"
            icon={SlidersHorizontal}
            headingLevel={3}
          />
          <p className="mt-3 text-sm font-semibold text-body">{config?.algorithm ?? '—'}</p>
          <p className="mt-1 text-[11px] text-dim">
            {config?.purpose ?? '—'}
          </p>
        </Card>

        <Card>
          <CardHeader
            title="Execution"
            description="How the result is produced"
            icon={Layers}
            headingLevel={3}
          />
          <p className="mt-3 text-sm font-semibold text-body">
            {config?.learningType ?? '—'}
          </p>
          <p className="mt-1 text-[11px] text-dim">Python generates the results CSV; the frontend reads it without retraining.</p>
        </Card>

        <Card>
          <CardHeader
            title="Results loaded"
            description="Current precomputed dataset"
            icon={CircleHelp}
            headingLevel={3}
          />
          <p className="mt-3 text-xs leading-5 text-muted">{status?.note ?? '—'}</p>
        </Card>

        <Card>
          <CardHeader
            title="Predictions"
            description="Decision score, not a probability"
            icon={Gauge}
            headingLevel={3}
          />
          <p className="mt-3 text-sm font-semibold text-body">{config?.scoreRange ?? '—'}</p>
          <p className="mt-1 text-[11px] text-dim">
            {config?.classification ?? '—'} The optional MWK 100,000 withdrawal rule is a separate comparison.
          </p>
        </Card>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:col-span-2">
          <Card className="flex h-full flex-col">
            <CardHeader
              title="How the model works"
              description="The steps behind the generated model prediction."
              icon={Sparkles}
            />

            <ul className="mt-4 space-y-3">
              {HOW_IT_WORKS.map((item) => (
                <li key={item.title} className="rounded-lg border border-hairline bg-panel-soft/40 p-3">
                  <p className="text-xs font-semibold text-body">{item.title}</p>
                  <p className="mt-1 text-[11px] leading-5 text-muted">{item.body}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="flex h-full flex-col">
            <CardHeader
              title="Model characteristics"
              description="What these unsupervised results do and do not mean."
              icon={ShieldAlert}
            />

            <ul className="mt-4 space-y-3">
              {RULE_NOTES.map((reason) => (
                <li key={reason} className="flex items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                  />
                  <span className="text-[11px] leading-5 text-muted">{reason}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto rounded-lg border border-warn/25 bg-warn/5 p-3">
              <p className="text-[11px] leading-5 text-warn">
                Anomaly scores are not fraud probabilities. No accuracy or fraud determination is claimed.
              </p>
            </div>
          </Card>
        </div>

        <MlPipeline stages={data?.stages} />
      </div>

      <FeatureGrid features={data?.features} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="flex h-full flex-col xl:col-span-2">
          <CardHeader
            title="Model and data provenance"
            description="How the Python-generated Isolation Forest results connect to this frontend."
            icon={BrainCircuit}
          />

          <ol className="mt-4 space-y-3 text-[11px] leading-5 text-muted">
            <li>
              <span className="text-body">Training execution: Python.</span> Run
              {' '}<code className="rounded bg-panel-soft px-1 py-0.5 text-[10px] text-brand">python ml/generate_malawi_model_results.py</code>
              {' '}from the project root to regenerate model output.
            </li>
            <li>
              <span className="text-body">Evaluation: not reported.</span> The synthetic injected labels
              are not used as model inputs and no model accuracy metrics are claimed.
            </li>
            <li>
              <span className="text-body">Frontend source: local synthetic CSV.</span> The frontend
              reads transaction fields and precomputed predictions from
              {' '}<code className="rounded bg-panel-soft px-1 py-0.5 text-[10px] text-brand">/data/malawi_anomaly_results.csv</code>
              and uses the model prediction and score columns directly.
            </li>
            <li>
              <span className="text-body">No database output is implied.</span> These frontend
              views do not submit review flags to Supabase or a backend API.
            </li>
          </ol>
        </Card>

        <Card className="flex h-full flex-col">
          <CardHeader
            title="Demonstration limitations"
            description="Important limits on interpreting a model anomaly."
            icon={Layers}
          />
          <ol className="mt-4 space-y-2 text-[11px] leading-5 text-muted">
            <li>1. Review all flags using appropriate operational context.</li>
            <li>2. Validate model behavior against independently verified labels before any operational use.</li>
            <li>3. Treat source labels as separate synthetic annotations, not proof of fraud.</li>
            <li>4. Keep this local demonstration separate from live banking systems.</li>
          </ol>
        </Card>
      </div>

      <ModelRunHistory runs={data?.runs} />
    </PageContainer>
  )
}

export default MlModel

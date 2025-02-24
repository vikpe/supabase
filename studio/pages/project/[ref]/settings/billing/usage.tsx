import dayjs from 'dayjs'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { IconArrowRight, Loading, Toggle } from 'ui'

import { NextPageWithLayout } from 'types'
import { useStore, useFlag } from 'hooks'
import { useProjectSubscriptionQuery } from 'data/subscriptions/project-subscription-query'
import { STRIPE_PRODUCT_IDS, TIME_PERIODS_REPORTS, TIME_PERIODS_BILLING } from 'lib/constants'
import { SettingsLayout } from 'components/layouts'
import LoadingUI from 'components/ui/Loading'
import DateRangePicker from 'components/to-be-cleaned/DateRangePicker'
import { PAYGUsage } from 'components/interfaces/Billing'
import ProjectUsageBars from 'components/interfaces/Settings/ProjectUsageBars/ProjectUsageBars'
import Usage from 'components/interfaces/BillingV2/Usage/Usage'

const ProjectBillingUsage: NextPageWithLayout = () => {
  const enableUsageV2 = useFlag('usagev2')
  const [showNewUsageUI, setShowNewUsageUI] = useState(enableUsageV2)

  return (
    <div className="relative">
      {enableUsageV2 && (
        <div className="absolute top-[1.9rem] right-16 xl:right-32 flex items-center space-x-3 z-10">
          <Toggle
            size="tiny"
            checked={showNewUsageUI}
            onChange={() => setShowNewUsageUI(!showNewUsageUI)}
          />
          <p className="text-xs text-scale-1100 -translate-y-[1px]">Preview new interface</p>
        </div>
      )}
      {enableUsageV2 && showNewUsageUI ? (
        <Usage />
      ) : (
        <div className="w-full h-full overflow-y-auto content">
          <div className="w-full mx-auto">
            <Settings />
          </div>
        </div>
      )}
    </div>
  )
}

ProjectBillingUsage.getLayout = (page) => (
  <SettingsLayout title="Billing and Usage">{page}</SettingsLayout>
)

export default observer(ProjectBillingUsage)

const Settings = () => {
  const { ui } = useStore()
  const project = ui.selectedProject

  const {
    data: subscription,
    isLoading: loading,
    error,
  } = useProjectSubscriptionQuery({ projectRef: ui.selectedProject?.ref })

  const [dateRange, setDateRange] = useState<any>()
  const isPayg = subscription?.tier?.prod_id === STRIPE_PRODUCT_IDS.PAYG

  useEffect(() => {
    if (error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to get project subscription: ${(error as any)?.message ?? 'unknown'}`,
      })
    }
  }, [error])

  if (!subscription) {
    return <LoadingUI />
  }

  return (
    <div className="container max-w-4xl p-4 space-y-8">
      {loading ? (
        <Loading active={loading}>
          <div className="w-full mb-8 overflow-hidden border rounded border-panel-border-light dark:border-panel-border-dark">
            <div className="flex items-center justify-center px-6 py-6 bg-panel-body-light dark:bg-panel-body-dark">
              <p>Loading usage breakdown</p>
            </div>
          </div>
        </Loading>
      ) : isPayg ? (
        <div>
          <div className="flex items-center mb-4 space-x-3">
            <DateRangePicker
              onChange={setDateRange}
              value={TIME_PERIODS_BILLING[0].key}
              options={[...TIME_PERIODS_BILLING, ...TIME_PERIODS_REPORTS]}
              loading={loading}
              currentBillingPeriodStart={subscription?.billing.current_period_start}
            />
            {dateRange && (
              <div className="flex items-center space-x-2">
                <p className="text-scale-1000">
                  {dayjs(dateRange.period_start.date).format('MMM D, YYYY')}
                </p>
                <p className="text-scale-1000">
                  <IconArrowRight size={12} />
                </p>
                <p className="text-scale-1000">
                  {dayjs(dateRange.period_end.date).format('MMM D, YYYY')}
                </p>
              </div>
            )}
          </div>
          {dateRange && <PAYGUsage dateRange={dateRange} />}
        </div>
      ) : (
        <ProjectUsageBars projectRef={project?.ref} />
      )}
    </div>
  )
}

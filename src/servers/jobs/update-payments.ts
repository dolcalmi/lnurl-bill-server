import { Bill } from "@app"
import { schedule, ScheduledTask } from "node-cron"

import { baseLogger } from "@services/logger"
import { wrapAsyncToRunInSpan } from "@services/tracing"

let scheduledTask: ScheduledTask
export const UpdatePaymentsJob = (cronExpression = "* * * * *"): IJob => {
  const task = wrapAsyncToRunInSpan({
    root: true,
    namespace: "jobs.updatePayments",
    fnName: "updatePayments",
    fn: async () => {
      baseLogger.info("init updatePayments")

      const result = await Bill.updatePayments()

      baseLogger.info({ result }, "finish updatePayments")
      return result
    },
  })

  if (!scheduledTask) {
    scheduledTask = schedule(cronExpression, task, { scheduled: false })
  }

  const start = (): void | JobError => {
    scheduledTask.start()
  }

  const stop = (): void | JobError => {
    scheduledTask.stop()
  }

  return {
    start,
    stop,
  }
}

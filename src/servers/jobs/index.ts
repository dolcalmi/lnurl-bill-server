import { UpdatePaymentsJob } from "./update-payments"

const updatePaymentsJob = UpdatePaymentsJob()

export const startJobs = () => {
  updatePaymentsJob.start()
}

export const stopJobs = () => {
  updatePaymentsJob.stop()
}

/* npm */
const cronJob = require('node-cron')
const promx = require('promx')
/* local */
const audit = require('./audit')
const filterResults = require('./filter-results')
const logger = require('./logger')
const queue = require('./queue')
const { createReportAndSave } = require('./report')
const { init, writeData } = require('./influx')
const { killBrowser, getBrowser } = require('./browser')
const { env, bus } = require('./utils')

const { urls, cron } = require('../config')

let browser, browserErr

const queueAuditUrl = (...args) => queue.add(() => auditUrl(...args))

async function auditUrl(url, { config, report } = {}) {
  const { lhr: result } = await audit(url, browser, undefined, config)
  const filtred = filterResults(result, url)
  await writeData(url, filtred)
  if (report) await createReportAndSave(url, result)
}

async function auditAllUrls() {
  for (const { url, plugins } of urls) {
    const plugin = plugins.find((i = {}) => i.name === 'lighthouse')
    if (!plugin) return logger.info(`runner: skipping ${url}`)
    queueAuditUrl(url, plugin)
  }
}

async function main() {
  await init();

    
  [browserErr, browser] = await promx(getBrowser())
  if (browserErr) throw browserErr
  
  await auditAllUrls()

  if (!cron) return
  
  const task = cronJob.schedule(cron, auditAllUrls, {scheduled: true, timezone: 'Europe/Berlin'})
  task.start()
  return task

}

/* main */

logger.info(`env: ${JSON.stringify(env, null, 2)}`)

main()
  .then(() => {})
  .catch(async (err) => {
    logger.error(err)
    await killBrowser(browser)
    process.exit(1)
  })

bus.on('audit:url', queueAuditUrl)

module.exports = require('./server')

const ora = require('ora')
const pm2 = require('pm2')
const path = require('path')
const util = require('util')

const { logger } = require('@ymo/cli-shared');

pm2.connectP = util.promisify(pm2.connect)
pm2.listP = util.promisify(pm2.list)
pm2.startP = util.promisify(pm2.start)
pm2.launchBusP = util.promisify(pm2.launchBus)
pm2.deleteP = util.promisify(pm2.delete)
pm2.sendDataToProcessIdP = util.promisify(pm2.sendDataToProcessId)
pm2.disconnectP = util.promisify(pm2.disconnect)
/**
 * 启动`cliSerivice`服务
 */
exports.startService = async function startService() {
  const spinner = ora('本地服务启动中...')
  spinner.start()
  // 连接pm2
  await connect(spinner)
  // 已经启动则跳过
  const hasStarted = await serviceHasStarted(spinner)

  if (hasStarted) {
    spinner.succeed('本地服务已启动')
    spinner.stop()
    console.log()
    await pm2.disconnectP()
    return
  }
  // 启动app
  await startApp(spinner)
  // 等待就绪，注意如果未就绪会直接process.exit强退
  await waitForAppReady(spinner)
}

/**
 * 停止`cliSerivice`服务
 */
exports.stopService = async function stopService() {
  const spinner = ora('本地服务关闭中...')
  await connect(spinner)
  const appList = await pm2.listP()
  if(appList.some((app) => app.name === 'cli-service')) {
    await pm2.deleteP('cli-service')
  }
  spinner.succeed('本地服务成功关闭')
  await pm2.disconnectP()
}

/**
 * 启动app
 */
async function startApp(spinner) {
  // const configFile = path.join(__dirname, './pm2.product.js')
  const configFile = path.join(__dirname, './ecosystem.config.js')

  try {
    spinner.text = '连接服务进程...'
    await pm2.startP(configFile)
  } catch (err) {
    await pm2.disconnectP()
    spinner.fail('启动失败')
    console.error('启动PM2服务失败')
    if (err instanceof Array) {
      throw err[0]
    } else {
      throw err
    }
  }
  await pm2.disconnectP()
}

/**
 * 连接pm2
 * @param {*} spinner
 */
async function connect(spinner) {
  try {
    spinner.text = '连接PM2中...'
    await pm2.connectP()
  } catch (err) {
    spinner.fail('启动失败')
    console.error('连接PM2失败')
    throw err
  }
}

/**
 * 启动pm2 bus
 * @param {*} spinner
 */
async function launchBus(spinner) {
  let bus
  try {
    bus = await pm2.launchBusP()
  } catch (err) {
    spinner.fail('启动失败')
    console.error('连接PM2 launchBus 失败')
    throw err
  }
  return bus
}


/**
 * 检查`pm list`中`cli-service`是否处于`online`状态
 */
async function serviceHasStarted(spinner) {
  const cliServiceApp = await getCLiServiceApp()
  if (cliServiceApp) {
    // 检测存在
    try {
      await checkCliServiceAlive(cliServiceApp, spinner)
      return true
    } catch (e) {
      return false
    }
  }
  return false
}

/**
 * `cli-service`是否存在于pm2的列表中
 */
async function getCLiServiceApp() {
  let apps
  try {
    apps = await pm2.listP()
  } catch (e) {
    return null
  }
  let cliApp
  apps.some((app, index) => {
    if (app.name === 'cli-service'
      && app.pm2_env.status === 'online') {
      cliApp = app
      cliApp.id = index
      return true
    }
    return false
  })
  return cliApp
}

/**
 * 检测`cli-service`是否存货
 */
async function checkCliServiceAlive(cliServiceApp, spinner) {
  // 连接pm2 bus
  const bus = await launchBus(spinner)
  const p = asyncTaskWithTimeout(new Promise((resolve) => {
    bus.on('cli-service: alive', () => {
      resolve()
    })
  }), 10000)
  await pm2.sendDataToProcessIdP({
    id: cliServiceApp.id,
    topic: 'cli-service: check alive',
    data: {}
  })
  return p
}

/**
 * 等待cli-service就绪
 * @param {*} bus
 * @param {*} spinner
 */
async function waitForAppReady(spinner) {
  spinner.text = '等待服务就绪...'
  // 连接pm2 bus
  const bus = await launchBus(spinner)
  try {
    await asyncTaskWithTimeout(new Promise((resolve) => {
      bus.on('cli-service: start success', () => {
        spinner.succeed('启动本地服务成功')
        spinner.stop()
        console.log()
        bus.close()
        resolve()
      })
    }), 30000)
  } catch (e) {
    spinner.fail('启动失败')
    if (e.message === 'TIMEOUT') {
      console.error('启动`cli-service`超时，请重试', 'PM2')
    } else {
      console.error('启动`cli-service`失败', 'PM2')
      console.error(e)
    }
    console.info('如果多次出现，请参考`https://doc.gem-mine.tech/#/zh-cn/toolkit/info/question`')
    console.log()
    throw e
  }
}

/**
 * 带超时时间的Promise
 * @param {*} p
 * @param {*} timeout
 */
async function asyncTaskWithTimeout(p, timeout) {
  let hasResolved = false
  let id
  return Promise.race([
    p.then((result) => {
      hasResolved = true
      // 取消计时防止进程卡死
      clearTimeout(id)
      return result
    }),
    new Promise((resolve) => {
      id = setTimeout(resolve, timeout)
    }).then(() => {
      if (!hasResolved) {
        throw new Error('TIMEOUT')
      }
    })
  ])
}

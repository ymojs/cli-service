const pm2 = require('pm2');
const util = require('util');
const ora = require('ora');
const { join } = require('path');
const { logger } = require('@ymo/cli-shared');

pm2.connectP = util.promisify(pm2.connect);
pm2.listP = util.promisify(pm2.list);
pm2.startP = util.promisify(pm2.start);
pm2.launchBusP = util.promisify(pm2.launchBus);
pm2.deleteP = util.promisify(pm2.delete);
pm2.sendDataToProcessIdP = util.promisify(pm2.sendDataToProcessId);
pm2.disconnectP = util.promisify(pm2.disconnect);

/**
 * 连接pm2
 * @param {*} spinner
 */
async function connectPm2(spinner) {
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
 * 带超时时间的Promise
 * @param {*} p
 * @param {*} timeout
 */
 async function asyncTaskWithTimeout(p, timeout) {
  let hasResolved = false
  let id
  console.log('!!!!!!!!!');
  return Promise.race([
    p.then((result) => {
      hasResolved = true
      console.log(id);
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

/**
 * 启动app
 */
 async function startApp(spinner) {
  const configFile = join(__dirname, './pm2.development.js');
  console.log(configFile);

  try {
    spinner.text = '连接服务进程...'
    await pm2.startP(configFile)
  } catch (err) {
    await pm2.disconnectP()
    console.log('hahaahahah...  disconnectP1111');
    spinner.fail('启动失败')
    console.error('启动PM2服务失败')
    if (err instanceof Array) {
      throw err[0]
    } else {
      throw err
    }
  }
  await pm2.disconnectP()
  console.log('hahaahahah...  disconnectP222');
}

/**
 * 等待cli-service就绪
 * @param {*} bus
 * @param {*} spinner
 */
async function waitForAppReady(spinner) {
  spinner.text = '等待PM2服务就绪...'
  // 连接pm2 bus
  const bus = await launchBus(spinner)
  try {
    await asyncTaskWithTimeout(new Promise((resolve) => {
      bus.on('cli-service: start success', () => {
        spinner.succeed('启动PM2服务成功')
        spinner.stop()
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
    // console.info('如果多次出现，请参考`https://doc.gem-mine.tech/#/zh-cn/toolkit/info/question`')
    console.log()
    throw e
  }
}

exports.createPm2 = async function createPm2() {
  const spinner = ora("启动pm2");
  spinner.start();
  await connectPm2(spinner);

  let isStarted = false;
  // 检测存在
  try {
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
    isStarted = true
  } catch (e) {
    isStarted = false
  }
  console.log('======= isStarted =======');
  console.log(isStarted);
  if (isStarted) {
    spinner.succeed('pm2服务已启动过.')
    spinner.stop()
    await pm2.disconnectP()
    return
  }
  // 启动app
  await startApp(spinner);
  // 等待就绪，注意如果未就绪会直接process.exit强退
  await waitForAppReady(spinner);
}

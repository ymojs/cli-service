const path = require('path')
const { env } = require('@ymo/cli-shared');

const index = path.join(__dirname, '../dist/index.js')

const now = new Date()
const date = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`

module.exports = {
  apps: [{
    name: 'cli-service',
    script: index,
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    error_file: `logs/cli-service-error-${date}.log`,
    out_file: `logs/cli-service-out-${date}.log`,
    env: {
      NODE_ENV: 'production',
    },
    cwd: env.ymojsHome
  }]
}


const { join } = require('path');
const { env } = require('@ymo/cli-shared');

const tsNode = join(require.resolve('ts-node'), '../bin.js');
const index = join(__dirname, '../src/index.ts');
console.log('<<<<<<<<<<<');
console.log(tsNode);
console.log(index);

module.exports = {
  apps: [{
    name: 'ymo-cli-service',
    script: tsNode,
    args: [
      index
    ],
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    error_file: './errors.log',
    env: {
      NODE_ENV: 'development',
    }
  }]
}
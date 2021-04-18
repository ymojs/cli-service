import defaultConfig from './config.default';
import { IS_IN_TS_NODE, NODE_ENV } from '../constants/common';
import { resolve } from 'path';
import { existsSync } from 'fs-extra';

export interface YmoConfig {
  // 环境
  env: string;

  // 端口
  port: number;

  [key: string]: any;
}

const ext = IS_IN_TS_NODE ? 'ts' : 'js';
let config: YmoConfig = {...defaultConfig};
const configFilePath = resolve(__dirname, `config.${NODE_ENV}.${ext}`);
if (existsSync(configFilePath)) {
  const { defualt: envConfig } = require(configFilePath);

  config = Object.assign({}, defaultConfig, envConfig);
}

export default config;
import { NODE_ENV, ROOT_DIR, APP_DIR, IS_IN_TS_NODE } from '../constants/common';
import { YmoConfig } from './index';

const config: YmoConfig = {
  env: NODE_ENV,

  port: 8338
};

export default config;
import { resolve } from 'path';
import { isWindows } from '../utils/isWindows';
import { isTsNode } from '../utils/isTsNode';

const _env = process.env;

export const NODE_ENV = _env.NODE_ENV || 'production';

export const IS_WINDOWS = isWindows();

// 是否是ts-node
export const IS_IN_TS_NODE = isTsNode();

// 项目根目录
export const ROOT_DIR = resolve(__dirname, '../../');

export const APP_DIR = resolve(ROOT_DIR, IS_IN_TS_NODE ? 'src' : 'dist');

export const HOME_DIR: string = (IS_WINDOWS ? process.env.USERPROFILE : process.env.HOME) || __dirname;

export const DATABASE_STORAGE_DIR = resolve(HOME_DIR, '.ymojs');
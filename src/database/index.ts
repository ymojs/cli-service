import lowdb from 'lowdb';
import FileSync from 'lowdb/adapters/FileAsync';
import { ensureDirSync } from 'fs-extra';
import { join } from 'path';
import { DATABASE_STORAGE_DIR } from '../constants/common';

const adapter = new FileSync(join(DATABASE_STORAGE_DIR, 'database.json'));

export var database;

export async function createDatabase() {
  ensureDirSync(DATABASE_STORAGE_DIR);
  database = await lowdb(adapter)
  await database.defaults({
    projects: [],

    components: []
  })
    .write()
}
// src/utils/local_db.js
import SQLite from 'react-native-sqlite-storage';

// Enable debug if needed
SQLite.DEBUG(true);
SQLite.enablePromise(true);

const database_name = 'logistics.db';
const database_version = '1.0';
const database_displayname = 'Logistics Database';
const database_size = 200000;

let db;

export const initDB = async () => {
  try {
    db = await SQLite.openDatabase(
      database_name,
      database_version,
      database_displayname,
      database_size
    );

    // Bills table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS bills (
        uuid TEXT PRIMARY KEY,
        syncStatus TEXT
      );
    `);

    // Bill Items table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS bill_items (
        uuid TEXT PRIMARY KEY,
        bill_id TEXT,
        FOREIGN KEY (bill_id) REFERENCES bills(uuid)
      );
    `);

    // Senders table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS senders (
        uuid TEXT PRIMARY KEY,
        company TEXT
      );
    `);

    // Consignees table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS consignees (
        uuid TEXT PRIMARY KEY,
        company TEXT
      );
    `);

    // Service Types table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS serviceTypes (
        uuid TEXT PRIMARY KEY,
        company TEXT
      );
    `);

    // Branches table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS branches (
        id INTEGER PRIMARY KEY,
        company TEXT
      );
    `);

    console.log('Database initialized');
    return db;
  } catch (error) {
    console.log('DB Init Error:', error);
    throw error;
  }
};

// Helper function to get database connection anywhere
export const getDB = () => db;
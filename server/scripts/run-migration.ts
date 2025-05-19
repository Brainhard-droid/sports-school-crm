import { readFileSync } from 'fs';
import path from 'path';
import { db } from '../db';

/**
 * Запускает SQL-миграцию из указанного файла
 */
async function runMigration(filename: string) {
  try {
    const filePath = path.join(__dirname, '../migrations', filename);
    console.log(`Запуск миграции из файла: ${filePath}`);
    
    const sql = readFileSync(filePath, 'utf8');
    console.log('SQL для выполнения:');
    console.log(sql);
    
    // Выполняем SQL-запрос
    await db.execute(sql);
    console.log('Миграция успешно выполнена');
  } catch (error) {
    console.error('Ошибка при выполнении миграции:', error);
    throw error;
  }
}

// Запускаем миграцию для добавления роли EMPLOYEE
async function main() {
  try {
    await runMigration('add_employee_role.sql');
    console.log('Все миграции успешно выполнены');
    process.exit(0);
  } catch (error) {
    console.error('Ошибка при выполнении миграций:', error);
    process.exit(1);
  }
}

main();
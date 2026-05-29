import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const files = [
  'room-types.json',
  'daily-status.json',
  'orders.json',
  'price-strategies.json',
  'channels.json',
  'members.json',
  'complaints.json',
  'reports.json'
];

console.log('=== 文件数据量验证 ===\n');
let allValid = true;

for (const file of files) {
  try {
    const filePath = path.join(__dirname, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    console.log(`✅ ${file}: ${data.length} 条记录`);
  } catch (e) {
    console.log(`❌ ${file}: 错误 - ${e.message}`);
    allValid = false;
  }
}

console.log('\n' + '='.repeat(40));
if (allValid) {
  console.log('✅ 所有文件验证通过！');
} else {
  console.log('❌ 部分文件存在问题，请检查。');
}

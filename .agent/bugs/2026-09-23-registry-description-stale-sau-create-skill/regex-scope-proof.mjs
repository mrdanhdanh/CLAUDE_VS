// Chứng minh: regex dựng NGOÀI vòng lặp (khi `name` chưa bind) bị rỗng,
// còn dựng TRONG vòng lặp thì bắt đúng placeholder họ 1.
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const TYPE = 'skill|instruction|agent|prompt|hook|local';
const target = 'skill video-clip';

// Mô phỏng bug cũ: `name` không bind ở scope ngoài → trong browser rơi vào window.name = ''
const buggy = new RegExp(`^(${TYPE})\\s+${esc('')}$`, 'i');
// Bản sửa: name bind đúng trong vòng lặp
const fixed = new RegExp(`^(${TYPE})\\s+${esc('video-clip')}$`, 'i');

console.log('placeholder thử:', JSON.stringify(target));
console.log('regex cũ  :', buggy.source, '→', buggy.test(target) ? 'BẮT ĐƯỢC' : 'MISS (lưới rỗng)');
console.log('regex mới :', fixed.source, '→', fixed.test(target) ? 'BẮT ĐƯỢC' : 'MISS');

if (buggy.test(target)) {
  console.error('⛔ Kỳ vọng regex cũ MISS để chứng minh lỗi — nhưng nó bắt được. Test này vô nghĩa.');
  process.exit(1);
}
if (!fixed.test(target)) {
  console.error('⛔ Regex mới phải bắt được — lưới vẫn rỗng.');
  process.exit(1);
}
console.log('✅ Chứng minh xong: lỗi cũ thật, bản sửa hoạt động.');

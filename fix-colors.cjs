const fs = require('fs');
const path = 'src/views/InvoiceView.jsx';

let content = fs.readFileSync(path, 'utf8');

// Replace standard colors
content = content.replace(/color:\s*'#bbb'/g, "color: '#888'");
content = content.replace(/background:\s*'#bbb'/g, "background: '#888'");
content = content.replace(/color:\s*#bbb/g, "color: #888");

content = content.replace(/color:\s*'#aaa'/g, "color: '#777'");
content = content.replace(/color:\s*#aaa/g, "color: #777");

content = content.replace(/color:\s*'#999'/g, "color: '#666'");
content = content.replace(/color:\s*#999/g, "color: #666");

fs.writeFileSync(path, content);
console.log('Fixed colors in InvoiceView.jsx');

// Update task.md
const taskPath = 'C:\\Users\\aaron\\.gemini\\antigravity\\brain\\478c2eab-053c-4012-8e2a-057017d4ed94\\task.md';
let taskContent = fs.readFileSync(taskPath, 'utf8');
taskContent = taskContent.replace('- `[ ]` 6. **Invoice**: Darken gray text contrast', '- `[x]` 6. **Invoice**: Darken gray text contrast');
fs.writeFileSync(taskPath, taskContent);

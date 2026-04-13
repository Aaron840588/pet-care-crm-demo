const fs = require('fs');
const path = 'src/views/ScheduleView.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Refactor applyDiscountToAll function signature and body
const oldFn = `  const applyDiscountToAll = useCallback((type, field, value) => {
    setDaySchedule(prev => prev.map(day => ({
      ...day,
      discounts: {
        ...day.discounts,
        [type]: { ...(day.discounts?.[type] || { amount: 0, label: '' }), [field]: value },
      },
    })));
  }, []);`;

const newFn = `  const applyDiscountToAll = useCallback((type, amount, label) => {
    setDaySchedule(prev => prev.map(day => ({
      ...day,
      discounts: {
        ...day.discounts,
        [type]: { amount, label },
      },
    })));
  }, []);`;

if (content.includes(oldFn.replace(/\n/g, '\r\n'))) {
  content = content.replace(oldFn.replace(/\n/g, '\r\n'), newFn.replace(/\n/g, '\r\n'));
} else if (content.includes(oldFn)) {
  content = content.replace(oldFn, newFn);
} else {
  console.log('applyDiscountToAll fn not found');
}

// 2. Refactor the onClick handlers
const oldClick = `onClick={() => { applyDiscountToAll(type, 'amount', Number(d.amount) || 0); applyDiscountToAll(type, 'label', d.label || ''); }}`;
const newClick = `onClick={() => { applyDiscountToAll(type, Number(d.amount) || 0, d.label || ''); }}`;

if (content.includes(oldClick)) {
  content = content.replace(oldClick, newClick);
  console.log('Replaced onClick');
} else {
  console.log('onClick not found');
}

fs.writeFileSync(path, content);
console.log('Done');

const fs = require('fs');
const path = 'src/views/ScheduleView.jsx';
let content = fs.readFileSync(path, 'utf8');

// Fix the broken applyServiceToAll and add missing callbacks
const broken = `  const applyServiceToAll = useCallback((svc) => {\r\n    if (!svc) return;\r\n    setDaySchedule(prev => prev.map(d => ({ ...d, service: svc })));\r\n    setEditingId(null);\r\n    setModalOpen(true);\r\n  }, []);\r\n`;

const fixed = `  const applyServiceToAll = useCallback((svc) => {\r\n    if (!svc) return;\r\n    setDaySchedule(prev => prev.map(d => ({ ...d, service: svc })));\r\n  }, []);\r\n\r\n  const applyTimeToAll = useCallback((time) => {\r\n    setDaySchedule(prev => prev.map(d => ({ ...d, time })));\r\n  }, []);\r\n\r\n  const updateDay = useCallback((idx, field, val) => {\r\n    setDaySchedule(prev => {\r\n      const next = [...prev];\r\n      next[idx] = { ...next[idx], [field]: val };\r\n      return next;\r\n    });\r\n  }, []);\r\n\r\n  const updateDayDiscount = useCallback((idx, type, field, value) => {\r\n    setDaySchedule(prev => prev.map((day, i) => {\r\n      if (i !== idx) return day;\r\n      return {\r\n        ...day,\r\n        discounts: {\r\n          ...day.discounts,\r\n          [type]: { ...(day.discounts?.[type] || { amount: 0, label: '' }), [field]: value },\r\n        },\r\n      };\r\n    }));\r\n  }, []);\r\n\r\n  const openAdd = useCallback(() => {\r\n    setFormData({ ...defaultBookingForm });\r\n    setDaySchedule([]);\r\n    setShowDays(false);\r\n    setEditingId(null);\r\n    setModalOpen(true);\r\n  }, []);\r\n`;

if (content.includes(broken)) {
  content = content.replace(broken, fixed);
  fs.writeFileSync(path, content);
  console.log('Fixed applyServiceToAll and added missing callbacks');
} else {
  console.log('TARGET NOT FOUND');
  // Show closest match
  const idx = content.indexOf('applyServiceToAll');
  console.log('Found at index:', idx);
  console.log('Context:', JSON.stringify(content.substring(idx, idx + 200)));
}

const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'src/views/ScheduleView.jsx');
let content = fs.readFileSync(srcPath, 'utf-8');

const startIndex = content.indexOf('{/* ── ADD / EDIT MODAL ── */}');
if (startIndex === -1) {
  console.log("Could not find start"); process.exit(1);
}

// Find start of modal JSX {modalOpen && ( <div className="overlay open">
const startParen = content.indexOf('{modalOpen && (', startIndex);

let leftCount = 0;
let rightCount = 0;
let currentIndex = startParen + '{modalOpen && ('.length;
let endIndex = -1;

for (let i = currentIndex; i < content.length; i++) {
  if (content[i] === '{') leftCount++;
  if (content[i] === '}') rightCount++;
  if (content[i] === '(') leftCount++;
  if (content[i] === ')') rightCount++;

  // The condition `{modalOpen && (` opens with an `(`, so when `rightCount > leftCount`, we've closed it
  if (rightCount > leftCount) {
    endIndex = i;
    break;
  }
}

const modalBlock = content.substring(currentIndex, endIndex - 1).trim();

const newModalComponent = `import React from 'react';
import { X, CalendarPlus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import NumericInput from '../../components/NumericInput';
import { DISC_MODES, calcDaySubtotal, calcDayDiscount, calcDayTotal } from '../../utils/calculations';
import { fmtDate, dateSortValue } from '../../utils/dates';

// Safe service label
const getServiceLabel = (b) => {
  if (b.daySchedule?.length > 0) {
    const svcs = [...new Set(b.daySchedule.map(d => d.service?.split('|')[0]).filter(Boolean))];
    return svcs.length === 1 ? svcs[0] : 'Mixed';
  }
  return b.service?.split('|')[0] || '—';
};

export default function ScheduleFormModal({
  modalOpen, setModalOpen, editingId, formData, setFormData, clients, services, set,
  handleStartDateChange, handleEndDateChange,
  showDays, setShowDays, daySchedule, updateDay, applyServiceToAll, applyTimeToAll,
  applyChargeToAll, updateDayDiscount, applyDiscountToAll,
  setDiscount, saving, handleSave
}) {
  if (!modalOpen) return null;

  return (
    ${modalBlock}
  );
}
`;

// Only create the new file and output length, do NOT overwrite ScheduleView yet
fs.writeFileSync(path.join(__dirname, 'src/features/schedule/ScheduleFormModal.jsx'), newModalComponent);
console.log("Extracted characters:", modalBlock.length);

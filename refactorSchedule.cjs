const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'src/views/ScheduleView.jsx');
let content = fs.readFileSync(srcPath, 'utf-8');

// The modal starts at `{modalOpen && (` and ends right before the final `</div>`
const modalRegex = /\{\/\* ── ADD \/ EDIT MODAL ── \*\/\}\s*\{modalOpen && \([\s\S]*?\)\}\s*(?=<\/div>\s*<\/div>\s*\);)/;

const match = content.match(modalRegex);
if (!match) {
  console.log("Could not find modal block");
  process.exit(1);
}

const modalContentBlock = match[0];

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

export default function ScheduleModal({
  modalOpen, setModalOpen, editingId, formData, setFormData, clients, services, set,
  handleStartDateChange, handleEndDateChange,
  showDays, setShowDays, daySchedule, updateDay, applyServiceToAll, applyTimeToAll,
  applyChargeToAll, updateDayDiscount, applyDiscountToAll,
  setDiscount, saving, handleSave
}) {
  if (!modalOpen) return null;

  return (
    ${modalContentBlock.replace(/\{modalOpen && \(/, '').replace(/\)\}$/, '')}
  );
}
`;

fs.writeFileSync(path.join(__dirname, 'src/features/schedule/ScheduleModal.jsx'), newModalComponent);

// Replace the block in the original file
const updatedContent = content.replace(modalRegex, `<ScheduleModal 
        modalOpen={modalOpen} setModalOpen={setModalOpen} editingId={editingId} 
        formData={formData} setFormData={setFormData} clients={clients} services={services} set={set}
        handleStartDateChange={handleStartDateChange} handleEndDateChange={handleEndDateChange}
        showDays={showDays} setShowDays={setShowDays} daySchedule={daySchedule} updateDay={updateDay}
        applyServiceToAll={applyServiceToAll} applyTimeToAll={applyTimeToAll} 
        applyChargeToAll={applyChargeToAll} updateDayDiscount={updateDayDiscount} 
        applyDiscountToAll={applyDiscountToAll} setDiscount={setDiscount}
        saving={saving} handleSave={handleSave} 
      />`);

const finalContent = "import ScheduleModal from '../features/schedule/ScheduleModal';\n" + updatedContent;

fs.writeFileSync(srcPath, finalContent);
console.log("ScheduleView successfully refactored!");

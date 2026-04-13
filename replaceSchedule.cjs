const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'src/views/ScheduleView.jsx');
let content = fs.readFileSync(srcPath, 'utf-8');

const startIndex = content.indexOf('{/* ── ADD / EDIT MODAL ── */}');
if (startIndex === -1) {
  console.log("Could not find start"); process.exit(1);
}

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

  if (rightCount > leftCount) {
    endIndex = i;
    break;
  }
}

const importStatement = "import ScheduleFormModal from '../features/schedule/ScheduleFormModal';\n";
const componentTag = `
      {/* ── ADD / EDIT MODAL ── */}
      <ScheduleFormModal 
        modalOpen={modalOpen} setModalOpen={setModalOpen} editingId={editingId} 
        formData={formData} setFormData={setFormData} clients={clients} services={services} set={set}
        handleStartDateChange={handleStartDateChange} handleEndDateChange={handleEndDateChange}
        showDays={showDays} setShowDays={setShowDays} daySchedule={daySchedule} updateDay={updateDay}
        applyServiceToAll={applyServiceToAll} applyTimeToAll={applyTimeToAll} 
        applyChargeToAll={applyChargeToAll} updateDayDiscount={updateDayDiscount} 
        applyDiscountToAll={applyDiscountToAll} setDiscount={setDiscount}
        saving={saving} handleSave={handleSave} 
      />
`;

// Replace from startIndex to endIndex
const newContent = importStatement + content.substring(0, startIndex) + componentTag + content.substring(endIndex + 1);

fs.writeFileSync(srcPath, newContent);
console.log("Replaced modal in ScheduleView successfully.");

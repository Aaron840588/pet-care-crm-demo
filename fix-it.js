const fs = require('fs');

const path = 'src/views/ScheduleView.jsx';
const lines = fs.readFileSync(path, 'utf8').split('\\n');

let out = [];
for (let i = 0; i < lines.length; i++) {
  if (i >= 807 && i <= 817) {
    if (i === 807) {
      out.push(\`                <div className="fg" style={{ margin: '0 0 8px' }}>\`);
      out.push(\`                  <label>Discount Type</label>\`);
      out.push(\`                  <select value={formData.discount.mode} onChange={e => setDiscount({ mode: e.target.value, value: 0 })}>\`);
      out.push(\`                    {DISC_MODES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}\`);
      out.push(\`                  </select>\`);
      out.push(\`                </div>\`);
      out.push(\`                {formData.discount.mode !== 'none' && (\`);
      out.push(\`                  <>\`);
      out.push(\`                    <div className="fg" style={{ margin: '0 0 8px' }}>\`);
      out.push(\`                      <label>Applies To</label>\`);
      out.push(\`                      <select\`);
      out.push(\`                        value={formData.discount.appliesTo || 'service'}\`);
      out.push(\`                        onChange={e => setDiscount({ appliesTo: e.target.value })}\`);
      out.push(\`                        style={{ fontWeight: 600 }}\`);
      out.push(\`                      >\`);
      out.push(\`                        <option value="service">Core Service (e.g. Twice-a-day Visit)</option>\`);
      out.push(\`                        <option value="extraPets">Additional Pets</option>\`);
      out.push(\`                        <option value="specialNeeds">Special Needs</option>\`);
      out.push(\`                        <option value="distance">Distance Add-on</option>\`);
      out.push(\`                        <option value="extraVisit">Extra Visit</option>\`);
      out.push(\`                      </select>\`);
      out.push(\`                    </div>\`);
      out.push(\`                    <div className="form-row">\`);
      out.push(\`                      <div className="fg" style={{ margin: 0 }}>\`);
      out.push(\`                        <label>Amount (₱)</label>\`);
      out.push(\`                        <NumericInput\`);
      out.push(\`                          value={formData.discount.value}\`);
      out.push(\`                          min={0}\`);
      out.push(\`                          fallbackValue="0"\`);
      out.push(\`                          onValueChange={(raw) => setDiscount({ value: Number.parseInt(raw || '0', 10) || 0 })}\`);
      out.push(\`                        />\`);
      out.push(\`                      </div>\`);
      out.push(\`                      <div className="fg" style={{ margin: 0 }}>\`);
      out.push(\`                        <label>Label / Reason</label>\`);
      out.push(\`                        <input\`);
      out.push(\`                          type="text" value={formData.discount.label}\`);
      out.push(\`                          onChange={e => setDiscount({ label: e.target.value })}\`);
      out.push(\`                          placeholder="e.g. Loyalty, waived 3 pets"\`);
      out.push(\`                        />\`);
      out.push(\`                      </div>\`);
      out.push(\`                    </div>\`);
      out.push(\`                  </>\`);
      out.push(\`                )}\`);
      out.push(\`              </div>\`);
    } else {
      // skipping lines 808-817
    }
  } else {
    out.push(lines[i]);
  }
}

fs.writeFileSync(path, out.join('\\n'));
console.log('Fixed');

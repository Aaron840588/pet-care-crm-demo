const fs = require('fs');
const path = 'src/views/ReportCardView.jsx';

let content = fs.readFileSync(path, 'utf8');

// 1. Add state for photos
content = content.replace(
  "const [downloading, setDownloading] = useState(false);",
  "const [downloading, setDownloading] = useState(false);\n  const [photos, setPhotos] = useState([]);"
);

// 2. Add handlePhotoSelect canvas resizer
const photoHandlerStr = `
  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (photos.length + files.length > 4) {
      toast('Maximum 4 photos allowed.', 'error');
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = Math.floor(height * (MAX_WIDTH / width));
            width = MAX_WIDTH;
          }
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

          setPhotos(prev => [...prev, dataUrl]);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
    
    // Clear input
    e.target.value = '';
  };

  const removePhoto = (idx) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  };
`;
content = content.replace("  const selectedClient = clients.find(c => c.id === form.clientId);", photoHandlerStr + "\n  const selectedClient = clients.find(c => c.id === form.clientId);");

// 3. Add Photo Input UI to the form side
const formUIStr = `          <div className="fg" style={{ marginBottom: '8px' }}>
            <label>Personal Message to Owner</label>`;
const newFormUIStr = `          <div className="fg" style={{ marginBottom: '14px' }}>
            <label>Attach Cute Photos (Max 4)</label>
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              onChange={handlePhotoSelect} 
              style={{ width: '100%', padding: '6px', fontSize: '13px' }} 
              disabled={photos.length >= 4}
            />
            {photos.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', mt: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                {photos.map((p, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <img src={p} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ccc' }} alt="Attachment" />
                    <button onClick={() => removePhoto(idx)} style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px' }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="fg" style={{ marginBottom: '8px' }}>
            <label>Personal Message to Owner</label>`;
content = content.replace(formUIStr, newFormUIStr);

// 4. Add Photos rendering to the Preview side
// The message block ends just before closing the white-card
// We will insert it before the closing </div> of rc-white-card.
const messagePreviewStr = `                <div className="rc-message-box" style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '14px', color: '#444', fontStyle: 'italic', lineHeight: 1.5, background: '#fdfbf7', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #ddccaa' }}>
                  "{form.message}"
                </div>
              )}
            </div>`;

const newMessagePreviewStr = `                <div className="rc-message-box" style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '14px', color: '#444', fontStyle: 'italic', lineHeight: 1.5, background: '#fdfbf7', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #ddccaa' }}>
                  "{form.message}"
                </div>
              )}

              {/* ── ATTACHED PHOTOS ── */}
              {photos.length > 0 && (
                <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: photos.length === 1 ? '1fr' : '1fr 1fr', gap: '8px' }}>
                  {photos.map((p, idx) => (
                    <img key={idx} src={p} alt="Fun moment" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
                  ))}
                </div>
              )}

            </div>`;

content = content.replace(messagePreviewStr, newMessagePreviewStr);

fs.writeFileSync(path, content);
console.log('Fixed ReportCardView.jsx');

// Update task.md
const taskPath = 'C:\\Users\\aaron\\.gemini\\antigravity\\brain\\478c2eab-053c-4012-8e2a-057017d4ed94\\task.md';
let taskContent = fs.readFileSync(taskPath, 'utf8');
taskContent = taskContent.replace('- `[ ]` 7. **Report Card**: Implement image upload, resize, and display', '- `[x]` 7. **Report Card**: Implement image upload, resize, and display');
fs.writeFileSync(taskPath, taskContent);

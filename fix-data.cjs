const fs = require('fs');
const path = 'src/store/DataContext.jsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(
  "const COLLECTION_KEYS = ['bookings', 'clients', 'invoices', 'reminders'];",
  "const COLLECTION_KEYS = ['bookings', 'clients', 'invoices', 'reminders', 'errands'];"
);

c = c.replace(
  "const [reminders, setReminders] = useState([]);",
  "const [reminders, setReminders] = useState([]);\n  const [errands, setErrands] = useState([]);"
);

const hooksStr = `    const unsubReminders = onSnapshot(
      collection(db, 'reminders'),
      handleSnapshot('reminders', setReminders),
      handleError('reminders')
    );`;

const newHooksStr = `    const unsubReminders = onSnapshot(
      collection(db, 'reminders'),
      handleSnapshot('reminders', setReminders),
      handleError('reminders')
    );

    const unsubErrands = onSnapshot(
      collection(db, 'errands'),
      handleSnapshot('errands', setErrands),
      handleError('errands')
    );`;

c = c.replace(hooksStr, newHooksStr);

const cleanupStr = `      unsubInvoices();
      unsubReminders();
      window.removeEventListener('online', handleOnline);`;

const newCleanupStr = `      unsubInvoices();
      unsubReminders();
      unsubErrands();
      window.removeEventListener('online', handleOnline);`;

c = c.replace(cleanupStr, newCleanupStr);

const valueStr = `    <DataContext.Provider value={{
      bookings, clients, invoices, reminders, services, setServices,
      loading, syncStatus, addBooking, updateBooking, deleteBooking,
      addClient, updateClient, deleteClient, addInvoice, updateInvoice, deleteInvoice, deleteReminder
    }}>`;

const newValueStr = `    <DataContext.Provider value={{
      bookings, clients, invoices, reminders, errands, services, setServices,
      loading, syncStatus, addBooking, updateBooking, deleteBooking,
      addClient, updateClient, deleteClient, addInvoice, updateInvoice, deleteInvoice, deleteReminder,
      addErrand, updateErrand, deleteErrand
    }}>`;

c = c.replace(valueStr, newValueStr);

// Add errand CRUD
const cruds = `
  const addErrand = async (errand) => {
    const { id: _id, ...data } = errand;
    await addDoc(collection(db, 'errands'), { ...data, createdAt: serverTimestamp() });
  };
  const updateErrand = async (id, data) => {
    await updateDoc(doc(db, 'errands', id), data);
  };
  const deleteErrand = async (id) => {
    await deleteDoc(doc(db, 'errands', id));
  };
`;
// Insert before return
c = c.replace("  return (", cruds + "\n  return (");

fs.writeFileSync(path, c);
console.log('Updated DataContext');

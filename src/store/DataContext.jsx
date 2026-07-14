import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  writeBatch,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase';
import { todayLocalStr } from '../utils/dates';

const DataContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const initialServices = [
  { id: '1', name: 'Basic Visit',              price: 200, defaultSub: 'up to 2 pets' },
  { id: '2', name: 'Play & Visit',             price: 250, defaultSub: 'up to 2 pets' },
  { id: '3', name: 'Twice-a-day Visit',        price: 350, defaultSub: 'up to 2 pets' },
  { id: '4', name: 'Twice-a-day Play & Visit', price: 450, defaultSub: 'up to 2 pets' },
];

const sanitizeServices = (servicesArray) => {
  if (!Array.isArray(servicesArray)) return initialServices;
  const sanitized = servicesArray.map((s, idx) => {
    if (!s || typeof s !== 'object') return null;
    const price = Math.max(0, Number(s.price) || 0);
    return {
      id: s.id ? String(s.id) : `imported-service-${idx}-${Date.now()}`,
      name: s.name ? String(s.name).trim() : 'Unnamed Service',
      price: isNaN(price) ? 0 : price,
      defaultSub: s.defaultSub ? String(s.defaultSub).trim() : '',
    };
  }).filter(Boolean);
  return sanitized.length > 0 ? sanitized : initialServices;
};

const COLLECTION_KEYS = ['bookings', 'clients', 'invoices', 'reminders', 'errands', 'ownPets', 'donations'];
const BATCH_MAX = 450;

const loadLocal = (key, fallbackValue) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallbackValue;
  } catch {
    return fallbackValue;
  }
};

const isDemo = import.meta.env.VITE_DEMO_MODE !== 'false';

// ── MOCK DATA FOR DEMO MODE ──────────────────────────────────────────────────
const demoClients = [
  {
    id: 'c1',
    name: 'Demo Client A',
    contact: '0917-000-0000',
    pets: [{ id: 'p1', name: 'Mochi', type: 'Dog', feedingTime: 'Morning and evening' }, { id: 'p2', name: 'Pepper', type: 'Cat' }],
    address: 'Demo City',
    gcash: '09170000000',
    keyStatus: 'received',
  },
  {
    id: 'c2',
    name: 'Demo Client B',
    contact: '0917-000-0001',
    pets: [{ id: 'p3', name: 'Coco', type: 'Dog', notes: 'Enjoys outdoor playtime.' }],
    address: 'Sample District',
    gcash: '09170000001',
    keyStatus: 'pending',
  },
  {
    id: 'c3',
    name: 'Sample Customer',
    contact: '0917-000-0002',
    pets: [{ id: 'p4', name: 'Luna', type: 'Cat' }, { id: 'p5', name: 'Biscuit', type: 'Dog' }],
    address: 'Fictional Town',
    keyStatus: 'none',
  },
];

const demoBookings = [
  {
    id: 'b1',
    clientId: 'c1',
    clientName: 'Demo Client A',
    startDate: todayLocalStr(),
    endDate: todayLocalStr(),
    status: 'active',
    timeText: '10:00 AM',
    service: 'Basic Visit|200',
    days: 1,
    total: 200,
    finalTotal: 200,
    discount: { mode: 'none', value: 0, label: '', appliesTo: 'service' },
    notes: 'Feed Mochi morning meal. Pepper needs water check.',
    daySchedule: [{
      date: todayLocalStr(),
      service: 'Basic Visit|200',
      time: '10:00 AM',
      extraPets: 0,
      specialNeeds: 0,
      specialNeedsNote: '',
      distance: 0,
      extraVisit: 0,
      dayDiscount: 0,
      dayDiscountNote: '',
      discounts: {},
    }],
  },
  {
    id: 'b2',
    clientId: 'c2',
    clientName: 'Demo Client B',
    startDate: todayLocalStr(),
    endDate: todayLocalStr(),
    status: 'pending',
    timeText: '2:00 PM',
    service: 'Play & Visit|250',
    days: 1,
    total: 250,
    finalTotal: 250,
    discount: { mode: 'none', value: 0, label: '', appliesTo: 'service' },
    notes: 'Coco loves playing with tennis balls.',
    daySchedule: [{
      date: todayLocalStr(),
      service: 'Play & Visit|250',
      time: '2:00 PM',
      extraPets: 0,
      specialNeeds: 0,
      specialNeedsNote: '',
      distance: 0,
      extraVisit: 0,
      dayDiscount: 0,
      dayDiscountNote: '',
      discounts: {},
    }],
  },
];

const demoInvoices = [
  {
    id: 'i1',
    clientId: 'c1',
    dateSaved: todayLocalStr(),
    gcash: '09170000000',
    toName: 'Demo Client A',
    pets: 'Mochi, Pepper',
    baseServiceName: 'Basic Visit',
    total: 200,
    paid: 0,
    tip: 0,
    lineItems: [{
      id: 'demo-line-1',
      customName: 'Basic Visit',
      subtitle: '(up to 2 pets)',
      days: 1,
      note: `(${todayLocalStr()})`,
      customRate: '200',
      discountMode: 'none',
      discountValue: 0,
      discountLabel: '',
    }],
    createdAt: { toDate: () => new Date(), toMillis: () => Date.now() },
  },
];

const demoOwnPets = [
  {
    id: 'op1',
    name: 'Pepper Rescue Cat',
    type: 'Cat',
    sex: 'Female',
    birthday: '',
    color: 'Orange Tabby',
    isSick: true,
    sickStartedAt: '2026-05-28',
    sicknessNotes: 'Demo observation. Appetite tracking.',
    vaccinesUpdated: false,
    lastVaccineDate: '',
    nextVaccineDate: '2026-06-20',
    vaccineNotes: 'Fictional vaccine reminder check.',
    notes: 'Demo foster care.',
  },
];

const demoDonations = [
  {
    id: 'd1',
    petId: 'op1',
    donorName: 'Demo Supporter',
    amount: 1000,
    rawDate: 'June 5, 2026 10:42 AM',
    referenceNumber: 'DEMO-123456-XYZ',
    channel: 'GCash',
    notes: 'Fictional demo record',
    rawText: 'You received PHP 1,000.00 from Demo Supporter Ref No. DEMO-123456-XYZ June 5, 2026 10:42 AM',
    screenshotName: 'gcash-demo.png',
    dateRecorded: todayLocalStr(),
  },
];
// ─────────────────────────────────────────────────────────────────────────────

export function DataProvider({ children }) {
  const [bookings, setBookings] = useState([]);
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [errands, setErrands] = useState([]);
  const [ownPets, setOwnPets] = useState([]);
  const [donations, setDonations] = useState([]);
  const [services, setServicesState] = useState(() => sanitizeServices(loadLocal('kats_services', initialServices)));
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState('connecting');

  const listenerStateRef = useRef({});

  useEffect(() => {
    if (isDemo) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setClients(demoClients);
      setBookings(demoBookings);
      setInvoices(demoInvoices);
      setReminders([{ id: 'r1', text: 'Give Mochi water check', done: false }]);
      setErrands([{ id: 'e1', title: 'Buy cat food', amount: 500, clientId: 'c2', isBilled: false, date: todayLocalStr() }]);
      setOwnPets(demoOwnPets);
      setDonations(demoDonations);
      setLoading(false);
      setSyncStatus('online');
      return;
    }

    listenerStateRef.current = Object.fromEntries(COLLECTION_KEYS.map((key) => [key, 'pending']));

    const timeout = setTimeout(() => {
      setLoading(false);
      setSyncStatus('offline');
    }, 8000);

    if (!window.navigator.onLine) {
      setSyncStatus('offline');
    }

    const markListenerState = (key, state) => {
      listenerStateRef.current[key] = state;
      const allResolved = COLLECTION_KEYS.every((name) => listenerStateRef.current[name] !== 'pending');
      const allHealthy = COLLECTION_KEYS.every((name) => listenerStateRef.current[name] === 'ok');

      if (allResolved) {
        clearTimeout(timeout);
        setLoading(false);
        setSyncStatus(window.navigator.onLine && allHealthy ? 'online' : 'offline');
      } else if (window.navigator.onLine) {
        setSyncStatus('connecting');
      }
    };

    const handleSnapshot = (key, setter) => (snap) => {
      setter(snap.docs.map((item) => ({ id: item.id, ...item.data() })));
      markListenerState(key, 'ok');
    };

    const handleError = (key) => () => {
      markListenerState(key, 'error');
      setSyncStatus('offline');
    };

    const unsubBookings = onSnapshot(query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(500)), handleSnapshot('bookings', setBookings), handleError('bookings'));
    const unsubClients = onSnapshot(collection(db, 'clients'), handleSnapshot('clients', setClients), handleError('clients'));
    const unsubInvoices = onSnapshot(query(collection(db, 'invoices'), orderBy('createdAt', 'desc'), limit(300)), handleSnapshot('invoices', setInvoices), handleError('invoices'));
    const unsubReminders = onSnapshot(collection(db, 'reminders'), handleSnapshot('reminders', setReminders), handleError('reminders'));
    const unsubErrands = onSnapshot(collection(db, 'errands'), handleSnapshot('errands', setErrands), handleError('errands'));
    const unsubOwnPets = onSnapshot(query(collection(db, 'ownPets'), orderBy('createdAt', 'desc'), limit(300)), handleSnapshot('ownPets', setOwnPets), handleError('ownPets'));
    const unsubDonations = onSnapshot(query(collection(db, 'donations'), orderBy('createdAt', 'desc'), limit(500)), handleSnapshot('donations', setDonations), handleError('donations'));

    const handleOnline = () => {
      const allResolved = COLLECTION_KEYS.every((name) => listenerStateRef.current[name] !== 'pending');
      const allHealthy = COLLECTION_KEYS.every((name) => listenerStateRef.current[name] === 'ok');
      setSyncStatus(allResolved && allHealthy ? 'online' : 'connecting');
    };

    const handleOffline = () => setSyncStatus('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearTimeout(timeout);
      unsubBookings();
      unsubClients();
      unsubInvoices();
      unsubReminders();
      unsubErrands();
      unsubOwnPets();
      unsubDonations();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('kats_services', JSON.stringify(services));
    } catch {
      // Ignore quota errors
    }
  }, [services]);

  const fakeId = () => Math.random().toString(36).substr(2, 9);
  const _add = (setter) => (obj) => {
    if (isDemo) return setter(p => [{ ...obj, id: fakeId(), createdAt: { toDate: () => new Date() } }, ...p]);
  };
  const _update = (setter) => (id, updates) => {
    if (isDemo) return setter(p => p.map(item => item.id === id ? { ...item, ...updates } : item));
  };
  const _remove = (setter) => (id) => {
    if (isDemo) return setter(p => p.filter(item => item.id !== id));
  };

  const addBooking = async (booking) => {
    if (isDemo) return _add(setBookings)(booking);
    const { id: _id, ...data } = booking;
    await addDoc(collection(db, 'bookings'), { ...data, createdAt: serverTimestamp() });
  };
  const updateBooking = async (id, updates) => {
    if (isDemo) return _update(setBookings)(id, updates);
    const { id: _id, createdAt: _createdAt, ...safeData } = updates;
    await updateDoc(doc(db, 'bookings', id), safeData);
  };
  const removeBooking = async (id) => {
    if (isDemo) return _remove(setBookings)(id);
    await deleteDoc(doc(db, 'bookings', id));
  };

  const addClient = async (client) => {
    if (isDemo) return _add(setClients)(client);
    const { id: _id, ...data } = client;
    await addDoc(collection(db, 'clients'), { ...data, createdAt: serverTimestamp() });
  };
  const updateClient = async (id, updates) => {
    if (isDemo) return _update(setClients)(id, updates);
    const { id: _id, createdAt: _createdAt, ...safeData } = updates;
    await updateDoc(doc(db, 'clients', id), safeData);
  };
  const removeClient = async (id) => {
    if (isDemo) return _remove(setClients)(id);
    await deleteDoc(doc(db, 'clients', id));
  };

  const addInvoice = async (invoice) => {
    if (isDemo) return _add(setInvoices)(invoice);
    const { id: _id, ...data } = invoice;
    await addDoc(collection(db, 'invoices'), { ...data, createdAt: serverTimestamp() });
  };
  const updateInvoice = async (id, updates) => {
    if (isDemo) return _update(setInvoices)(id, updates);
    const { id: _id, createdAt: _createdAt, ...safeData } = updates;
    await updateDoc(doc(db, 'invoices', id), safeData);
  };
  const removeInvoice = async (id) => {
    if (isDemo) return _remove(setInvoices)(id);
    await deleteDoc(doc(db, 'invoices', id));
  };

  const addReminder = async (text) => {
    if (isDemo) return _add(setReminders)({ text, done: false });
    await addDoc(collection(db, 'reminders'), { text, done: false, createdAt: serverTimestamp() });
  };
  const toggleReminder = async (id, current) => {
    if (isDemo) return _update(setReminders)(id, { done: !current });
    await updateDoc(doc(db, 'reminders', id), { done: !current });
  };
  const removeReminder = async (id) => {
    if (isDemo) return _remove(setReminders)(id);
    await deleteDoc(doc(db, 'reminders', id));
  };

  const addErrand = async (errand) => {
    if (isDemo) return _add(setErrands)(errand);
    const { id: _id, ...data } = errand;
    await addDoc(collection(db, 'errands'), { ...data, createdAt: serverTimestamp() });
  };
  const updateErrand = async (id, updates) => {
    if (isDemo) return _update(setErrands)(id, updates);
    const { id: _id, createdAt: _createdAt, ...safeData } = updates;
    await updateDoc(doc(db, 'errands', id), safeData);
  };
  const deleteErrand = async (id) => {
    if (isDemo) return _remove(setErrands)(id);
    await deleteDoc(doc(db, 'errands', id));
  };

  const addOwnPet = async (pet) => {
    if (isDemo) return _add(setOwnPets)(pet);
    const { id: _id, ...data } = pet;
    await addDoc(collection(db, 'ownPets'), { ...data, createdAt: serverTimestamp() });
  };
  const updateOwnPet = async (id, updates) => {
    if (isDemo) return _update(setOwnPets)(id, updates);
    const { id: _id, createdAt: _createdAt, ...safeData } = updates;
    await updateDoc(doc(db, 'ownPets', id), safeData);
  };
  const removeOwnPet = async (id) => {
    if (isDemo) return _remove(setOwnPets)(id);
    await deleteDoc(doc(db, 'ownPets', id));
  };

  const addDonation = async (donation) => {
    if (isDemo) return _add(setDonations)(donation);
    const { id: _id, ...data } = donation;
    await addDoc(collection(db, 'donations'), { ...data, createdAt: serverTimestamp() });
  };
  const updateDonation = async (id, updates) => {
    if (isDemo) return _update(setDonations)(id, updates);
    const { id: _id, createdAt: _createdAt, ...safeData } = updates;
    await updateDoc(doc(db, 'donations', id), safeData);
  };
  const removeDonation = async (id) => {
    if (isDemo) return _remove(setDonations)(id);
    await deleteDoc(doc(db, 'donations', id));
  };

  const exportData = () => {
    const data = {
      bookings,
      clients,
      services,
      invoices,
      reminders,
      errands,
      ownPets,
      donations,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = isDemo ? `Demo_Sandbox_CRM_Backup_${todayLocalStr()}.json` : `Kat_CRM_Backup_${todayLocalStr()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };

  const commitDeletes = async (colName, existingItems = []) => {
    if (isDemo) return;
    const ids = existingItems.map((item) => item?.id).filter(Boolean);
    if (!ids.length) return;
    let batch = writeBatch(db);
    let count = 0;
    for (const id of ids) {
       batch.delete(doc(db, colName, id));
       count++;
       if (count === BATCH_MAX) {
         await batch.commit();
         batch = writeBatch(db);
         count = 0;
       }
    }
    if (count > 0) await batch.commit();
  };

  const commitImports = async (colName, items = []) => {
    if (isDemo) return;
    if (!items.length) return;
    let batch = writeBatch(db);
    let count = 0;
    for (const item of items) {
      const { id, createdAt: _createdAt, ...rest } = item || {};
      const targetRef = id ? doc(db, colName, id) : doc(collection(db, colName));
      batch.set(targetRef, rest);
      count++;
      if (count === BATCH_MAX) {
         await batch.commit();
         batch = writeBatch(db);
         count = 0;
      }
    }
    if (count > 0) await batch.commit();
  };

  const importData = async (jsonData) => {
    if (isDemo) {
      throw new Error('Import is disabled in Demo Sandbox Mode.');
    }
    const data = JSON.parse(jsonData);
    const existingByCollection = { bookings, clients, invoices, reminders, errands, ownPets, donations };
    for (const colName of COLLECTION_KEYS) {
      await commitDeletes(colName, existingByCollection[colName]);
      await commitImports(colName, Array.isArray(data[colName]) ? data[colName] : []);
    }
    if (Array.isArray(data.services)) setServicesState(sanitizeServices(data.services));
  };

  return (
    <DataContext.Provider value={{
      bookings, addBooking, updateBooking, removeBooking,
      clients, addClient, updateClient, removeClient,
      invoices, addInvoice, updateInvoice, removeInvoice,
      reminders, addReminder, toggleReminder, removeReminder,
      errands, addErrand, updateErrand, deleteErrand,
      ownPets, addOwnPet, updateOwnPet, removeOwnPet,
      donations, addDonation, updateDonation, removeDonation,
      services, setServices: setServicesState,
      exportData, importData,
      loading, syncStatus,
    }}
    >
      {children}
    </DataContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useData = () => useContext(DataContext);

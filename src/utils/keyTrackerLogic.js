export const KEY_STATUS_ORDER = ['pending', 'received', 'returned'];

export const getKeyStatus = (client) => client?.keyStatus || 'none';

export const getKeyStatusCounts = (clients = []) => (
  KEY_STATUS_ORDER.reduce((counts, status) => {
    counts[status] = clients.filter((client) => getKeyStatus(client) === status).length;
    return counts;
  }, {})
);

export const filterKeyClientsByStatus = (clients = [], status = null) => (
  clients.filter((client) => {
    const currentStatus = getKeyStatus(client);
    if (currentStatus === 'none') return false;
    return status ? currentStatus === status : true;
  })
);

export const getOrderedKeyClients = (clients = [], status = null) => {
  const activeClients = filterKeyClientsByStatus(clients, status);
  if (status) return activeClients;

  return KEY_STATUS_ORDER.flatMap((currentStatus) => (
    activeClients.filter((client) => getKeyStatus(client) === currentStatus)
  ));
};

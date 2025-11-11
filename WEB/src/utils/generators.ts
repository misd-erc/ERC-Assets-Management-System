export const generateItemCode = (): string => {
  const year = new Date().getFullYear();
  const nextId = Math.floor(Math.random() * 10000) + 1;
  return `ITM-${year}-${String(nextId).padStart(4, '0')}`;
};

export const generateRISNumber = (): string => {
  const year = new Date().getFullYear();
  const nextId = Math.floor(Math.random() * 1000) + 1;
  return `RIS-${year}-${String(nextId).padStart(3, '0')}`;
};

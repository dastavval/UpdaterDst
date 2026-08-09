
export const generateId = (prefix: string = 'id'): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${randomStr}`;
};

export const generateProductCode = (): string => {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `PRD-${num}`;
};

export const generateFactoryCode = (): string => {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `FAC-${num}`;
};

export const generateUserCode = (role: string = 'customer'): string => {
  const num = Math.floor(10000 + Math.random() * 90000);
  const prefix = role === 'agent' ? 'AGN' : role === 'factory' ? 'FAC' : role === 'admin' ? 'ADM' : 'CST';
  return `${prefix}-${num}`;
};

export const generateCategoryCode = (): string => {
  const num = Math.floor(100 + Math.random() * 900);
  return `CAT-${num}`;
};

import axiosInstance from '../../lib/axios';

interface Department {
  id: string;
  name: string;
  head: string;
}

export const getDepartments = async (): Promise<Department[]> => {
  // const response = await axiosInstance.get('/departments');
  // return response.data;

  // Mock implementation
  return [
    { id: '1', name: 'IT Department', head: 'John Doe' },
    { id: '2', name: 'Finance', head: 'Jane Smith' },
    { id: '3', name: 'Admin Office', head: 'Bob Johnson' },
  ];
};

export const createDepartment = async (department: Omit<Department, 'id'>): Promise<Department> => {
  // const response = await axiosInstance.post('/departments', department);
  // return response.data;

  // Mock implementation
  const newDepartment: Department = { ...department, id: Date.now().toString() };
  return newDepartment;
};

export const updateDepartment = async (id: string, updates: Partial<Department>): Promise<Department> => {
  // const response = await axiosInstance.put(`/departments/${id}`, updates);
  // return response.data;

  // Mock implementation
  const department = await getDepartments().then(depts => depts.find(d => d.id === id));
  if (!department) throw new Error('Department not found');
  return { ...department, ...updates };
};

export const deleteDepartment = async (id: string): Promise<void> => {
  // await axiosInstance.delete(`/departments/${id}`);

  // Mock implementation
  return Promise.resolve();
};

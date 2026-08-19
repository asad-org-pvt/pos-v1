import { employeeService } from "../../services/app/EmployeeService";

// get Employees from inventory
export const getAllEmployees = async () => {
  return await employeeService.getEmployees();
};

// add Employee in inventory
export const addOneEmployee = async (employee: any) => {
  return await employeeService.createEmployee(employee);
};

// delete Employee api
export const deleteOneEmployee = async (id: string) => {
  return await employeeService.deleteEmployee(id);
};

// edit Employee api
export const editEmployee = async (id: string, employee: any) => {
  return await employeeService.updateEmployee(id, employee);
};
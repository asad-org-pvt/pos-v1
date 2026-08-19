import React, { useMemo } from "react";
import EditIcon from "../../../assets/component/EditIcon";
import RemoveIcon from "../../../assets/component/RemoveIcon";
import { Colors } from "../../common/colors";
import Table from "../../common/components/table";
import { useStylesFromThemeFunction } from "./EmployeeList";
import toast from "react-hot-toast";
import { Modal } from "react-bootstrap";
import { getAllEmployees, editEmployee, deleteOneEmployee } from "../../../parser/employee";
import EmployeeForm from "../employee-form";

interface ComponentProps {
  employees?: any[];
}

const EmployeeList: React.FC<ComponentProps> = (props) => {
  const classes = useStylesFromThemeFunction();
  const [tableHeadings] = React.useState([
    "id",
    "Name",
    "Designation",
    "Department",
    "Phone Number",
    "Address",
    "Actions",
  ] as string[]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedEmployee, setSelectedEmployee] = React.useState({} as any);
  const [employees, setEmployees] = React.useState(
    (props?.employees as any[]) || []
  );
  const [showEmployeeUpdateModal, setShowEmployeeUpdateModal] =
    React.useState(false);

  const loadEmployees = () => {
    setIsLoading(true);
    getAllEmployees()
      .then((res) => {
        setEmployees(res);
      })
      .catch((err) => {
        toast.error("Failed to load employees");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  React.useEffect(() => {
    loadEmployees();
  }, []);

  const handleRemoveEmployee = async (employee: any) => {
    if (window.confirm(`Are you sure you want to remove "${employee.name}"?`)) {
      try {
        await deleteOneEmployee(employee.id);
        toast.success(`${employee.name} removed successfully`);
        loadEmployees();
      } catch (e: any) {
        toast.error(e.message || "Error while removing employee");
      }
    }
  };

  const handleEditEmployee = (employee: any) => {
    setSelectedEmployee(employee);
    setShowEmployeeUpdateModal(true);
  };

  const handleUpdate = (updatedEmployee: any) => {
    editEmployee(updatedEmployee.id, updatedEmployee)
      .then(() => {
        toast.success(`${updatedEmployee.name} updated successfully`);
        setShowEmployeeUpdateModal(false);
        setSelectedEmployee({} as any);
        loadEmployees();
      })
      .catch((e: any) => {
        toast.error(e.message || "Error while updating employee");
      });
  };

  const renderTableData = useMemo(() => {
    return employees?.map((employee) => {
      return (
        <tr
          key={employee.id}
          onDoubleClick={() => handleEditEmployee(employee)}
        >
          <td>{employee.id}</td>
          <td>{employee.name}</td>
          <td>{employee.designation || employee.jobTitle || "-"}</td>
          <td>{employee.department || "-"}</td>
          <td>{employee.phoneNumber || "-"}</td>
          <td>{employee.address || "-"}</td>
          <td>
            <div className={classes.equallyDistantRow}>
              <div
                className={classes.iconWrapper}
                onClick={() => handleEditEmployee(employee)}
              >
                <EditIcon fill={Colors.gray} />
              </div>
              <div
                className={classes.iconWrapper}
                onClick={() => handleRemoveEmployee(employee)}
              >
                <RemoveIcon fill={Colors.red} />
              </div>
            </div>
          </td>
        </tr>
      );
    });
  }, [employees]);

  return (
    <>
      <Table
        tableHeadings={tableHeadings}
        renderBody={renderTableData}
        loading={isLoading}
      />
      <Modal
        className={classes.modalWrapper}
        show={showEmployeeUpdateModal}
        onHide={() => setShowEmployeeUpdateModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Update <b>{selectedEmployee?.name}</b>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className={classes.modalBodyWrapper}>
            <EmployeeForm employee={selectedEmployee} onSubmit={handleUpdate} />
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default EmployeeList;

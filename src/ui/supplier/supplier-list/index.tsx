import React, { useMemo } from "react";
import EditIcon from "../../../assets/component/EditIcon";
import RemoveIcon from "../../../assets/component/RemoveIcon";
import { Colors } from "../../common/colors";
import Table from "../../common/components/table";
import { useStylesFromThemeFunction } from "./SupplierList";
import toast from "react-hot-toast";
import { Modal } from "react-bootstrap";
import { getAllSuppliers, editSupplier, deleteOneSupplier } from "../../../parser/supplier";
import SupplierForm from "../supplier-form";

interface ComponentProps {
  suppliers?: any[];
}

const SupplierList: React.FC<ComponentProps> = (props) => {
  const classes = useStylesFromThemeFunction();
  const [tableHeadings] = React.useState([
    "id",
    "Name",
    "State",
    "Country",
    "Phone Number",
    "Address",
    "Actions",
  ] as string[]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedSupplier, setSelectedSupplier] = React.useState({} as any);
  const [suppliers, setSuppliers] = React.useState(
    (props?.suppliers as any[]) || []
  );
  const [showSupplierUpdateModal, setShowSupplierUpdateModal] =
    React.useState(false);

  const loadSuppliers = () => {
    setIsLoading(true);
    getAllSuppliers()
      .then((res) => {
        setSuppliers(res);
      })
      .catch((err) => {
        toast.error("Failed to load suppliers");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  React.useEffect(() => {
    loadSuppliers();
  }, []);

  const handleRemoveSupplier = async (supplier: any) => {
    if (window.confirm(`Are you sure you want to remove "${supplier.name}"?`)) {
      try {
        await deleteOneSupplier(supplier.id);
        toast.success(`${supplier.name} removed successfully`);
        loadSuppliers();
      } catch (e: any) {
        toast.error(e.message || "Error while removing supplier");
      }
    }
  };

  const handleEditSupplier = (supplier: any) => {
    setSelectedSupplier(supplier);
    setShowSupplierUpdateModal(true);
  };

  const handleUpdate = (updatedSupplier: any) => {
    editSupplier(updatedSupplier.id, updatedSupplier)
      .then(() => {
        toast.success(`${updatedSupplier.name} updated successfully`);
        setShowSupplierUpdateModal(false);
        setSelectedSupplier({} as any);
        loadSuppliers();
      })
      .catch((e: any) => {
        toast.error(e.message || "Error while updating supplier");
      });
  };

  const renderTableData = useMemo(() => {
    return suppliers?.map((supplier) => {
      return (
        <tr
          key={supplier.id}
          onDoubleClick={() => handleEditSupplier(supplier)}
        >
          <td>{supplier.id}</td>
          <td>{supplier.name}</td>
          <td>{supplier.state}</td>
          <td>{supplier.country}</td>
          <td>{supplier.phoneNumber}</td>
          <td>{supplier.address}</td>
          <td>
            <div className={classes.equallyDistantRow}>
              <div
                className={classes.iconWrapper}
                onClick={() => handleEditSupplier(supplier)}
              >
                <EditIcon fill={Colors.gray} />
              </div>
              <div
                className={classes.iconWrapper}
                onClick={() => handleRemoveSupplier(supplier)}
              >
                <RemoveIcon fill={Colors.red} />
              </div>
            </div>
          </td>
        </tr>
      );
    });
  }, [suppliers]);

  return (
    <>
      <Table
        tableHeadings={tableHeadings}
        renderBody={renderTableData}
        loading={isLoading}
      />
      <Modal
        className={classes.modalWrapper}
        show={showSupplierUpdateModal}
        onHide={() => setShowSupplierUpdateModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Update <b>{selectedSupplier?.name}</b>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className={classes.modalBodyWrapper}>
            <SupplierForm supplier={selectedSupplier} onSubmit={handleUpdate} />
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default SupplierList;

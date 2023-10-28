import React, { useEffect, useState } from "react";
import { Col, Collapse, Nav, Row, Tab } from "react-bootstrap";
import { POSEngine } from "../pos-engine";
import { useStylesFromThemeFunction, ComponentProps } from "./AppLayout";
// import "boxicons";
import Inventory from "../inventory";
import Users from "../users";
import Category from "../category";
import SalesRoute from "../sales-route";
import Order from "../order";
import Sales from "../sales";
import Setting from "../setting";
import { Route, Routes, useNavigate } from "react-router-dom";
import Login from "../auth/login";
import ResetPassword from "../auth/reset-password";
import Signup from "../auth/signup";
import VerifyEmail from "../auth/verify-email";
import { adminRoutes, organizationRoutes } from "./routes";
import { useSelector } from "react-redux";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../services/cloud";
import { LOGIN_PATH } from "../common/constants";

const AppLayout: React.FC<ComponentProps> = () => {
  const classes = useStylesFromThemeFunction();
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentUser, setCurrentUser] = useState({} as any);
  const isAuthenticated = () => {
    if (!localStorage.getItem("tkn")) {
      return false;
    }
    return true;
  };
  const isAdmin = () => {
    if (!localStorage.getItem("isAdmin")) {
      return false;
    }
    return true;
  };

  useEffect(() => {
    onAuthStateChanged(auth.getInstance(), (user) => {
      setCurrentUser(user);
    });

    if (!isAuthenticated()) {
      navigate(LOGIN_PATH);
    } else {
      if (window.location.pathname === "/") {
        navigate("/organization/pos");
        // history.replace(isAdmin ? '/admin/members' : '/provider/members');
      }
    }
  }, []);

  const handleTabClick = (e, url) => {
    e.preventDefault();
    navigate(url);
  };
  return (
    <>
      {
        <Tab.Container defaultActiveKey="pos">
          <Row>
            {isAuthenticated() && (
              <Col sm={3}>
                <div
                  className={`${
                    showSidebar ? classes.tabsWithSidebar : classes.tabs
                  }`}
                >
                  <div className={classes.tabsStyle}>
                    <Collapse in={showSidebar}>
                      <Nav variant="pills" className="flex-column">
                        <Nav.Item className={classes.link}>
                          <Nav.Link
                            eventKey="pos"
                            className={classes.link}
                            onClick={(e) =>
                              handleTabClick(e, "/organization/pos")
                            }
                          >
                            <div className={classes.link}>
                              <i className="bx bx-desktop"></i> POS
                            </div>
                          </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                          <Nav.Link
                            eventKey="inventory"
                            onClick={(e) =>
                              handleTabClick(e, "/organization/inventory")
                            }
                          >
                            <div className={classes.link}>
                              <i className="bx bxs-package"></i> Inventory
                            </div>
                          </Nav.Link>
                        </Nav.Item>

                        {/* <Nav.Item>
                        <Nav.Link eventKey="sales">
                          <div className={classes.link}>
                            <i className="bx bxs-pie-chart-alt-2"></i> Sales
                          </div>
                        </Nav.Link>
                      </Nav.Item> */}

                        <Nav.Item>
                          <Nav.Link
                            eventKey="orders"
                            onClick={(e) =>
                              handleTabClick(e, "/organization/orders")
                            }
                          >
                            <div className={classes.link}>
                              <i className="bx bxs-cart"></i> Orders
                            </div>
                          </Nav.Link>
                        </Nav.Item>

                        {/* <Nav.Item>
                        <Nav.Link eventKey="sales-route">
                          <div className={classes.link}>
                            <i className="bx bxs-map"></i> Sales Route
                          </div>
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="categories">
                          <div className={classes.link}>
                            <i className="bx bxs-category"></i> Categories
                          </div>
                        </Nav.Link>
                      </Nav.Item> */}

                        <Nav.Item>
                          <Nav.Link
                            eventKey="users"
                            onClick={(e) =>
                              handleTabClick(e, "/organization/users")
                            }
                          >
                            <div className={classes.link}>
                              <i className="bx bxs-group"></i> Users
                            </div>
                          </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                          <Nav.Link
                            eventKey="settings"
                            onClick={(e) =>
                              handleTabClick(e, "/organization/settings")
                            }
                          >
                            <div className={classes.link}>
                              <i className="bx bxs-brightness"></i> Settings
                            </div>
                          </Nav.Link>
                        </Nav.Item>
                      </Nav>
                    </Collapse>
                  </div>
                  <h2
                    onClick={() => setShowSidebar(!showSidebar)}
                    className={classes.SidebarArrow}
                  >
                    <i
                      className={`${
                        showSidebar
                          ? "bx bx-chevron-left"
                          : "bx bx-chevron-right"
                      }`}
                    ></i>
                  </h2>
                </div>
              </Col>
            )}
            <Col sm={12}>
              <div
                className={`${
                  showSidebar
                    ? classes.contentPanWithSidebar
                    : classes.contentPan
                }`}
              >
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />

                  {/* <Route  */}
                  {isAuthenticated() && (
                    <Route path="/organization/pos" element={<POSEngine />} />
                  )}
                  {isAuthenticated() && (
                    <Route
                      path="/organization/inventory"
                      element={<Inventory />}
                    />
                  )}
                  {isAuthenticated() && (
                    <Route path="/organization/orders" element={<Order />} />
                  )}
                  {isAuthenticated() && (
                    <Route path="/organization/users" element={<Users />} />
                  )}
                  {isAuthenticated() && (
                    <Route
                      path="/organization/settings"
                      element={<Setting />}
                    />
                  )}
                  {/* {isAuthenticated() && (
                    <>

                      {/* {(isAdmin() ? adminRoutes : organizationRoutes).map( */}
                  {/* {organizationRoutes.map(
                        ({ path, component: Component }) => (
                          <Route
                            path={path}
                            element={<Component />}
                            key={path}
                          />
                        )
                      )} }
                    </>
                  )} */}
                  <Route
                    path="/"
                    element={!isAuthenticated() ? <Login /> : <POSEngine />}
                  />
                </Routes>
              </div>
            </Col>
          </Row>
        </Tab.Container>
      }
    </>
  );
};
export default AppLayout;

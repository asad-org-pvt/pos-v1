import React, { useEffect, useState } from "react";
import { Col, Collapse, Nav, Row, Tab } from "react-bootstrap";
import { POSEngine } from "../pos-engine";
import { useStylesFromThemeFunction, ComponentProps } from "./AppLayout";
import Inventory from "../inventory";
import Users from "../users";
import Order from "../order";
import Setting from "../setting";
import PurchasingView from "../purchasing";
import ReportsView from "../reports";
import { Route, Routes, useNavigate, useLocation } from "react-router-dom";
import Login from "../auth/login";
import ResetPassword from "../auth/reset-password";
import Signup from "../auth/signup";
import VerifyEmail from "../auth/verify-email";
import { LOGIN_PATH } from "../common/constants";
import Organisation from "../organisation";
import { Box, CircularProgress } from "@mui/material";
import { useAuthTenant } from "../../context/AuthTenantContext";

const windowHeight = typeof window !== "undefined" ? window.innerHeight : 800;

const AUTH_PATHS = ["/login", "/signup", "/reset-password", "/verify-email"];

const AppLayout: React.FC<ComponentProps> = () => {
  const classes = useStylesFromThemeFunction();
  const navigate = useNavigate();
  const location = useLocation();
  const [showSidebar, setShowSidebar] = useState(true);

  const { isAuthenticated, isAdmin, isLoading } = useAuthTenant();

  useEffect(() => {
    if (!isLoading) {
      const isAuthRoute = AUTH_PATHS.includes(location.pathname);
      if (!isAuthenticated && !isAuthRoute) {
        setShowSidebar(false);
        navigate(LOGIN_PATH);
      } else if (isAuthenticated && (location.pathname === "/" || isAuthRoute)) {
        setShowSidebar(true);
        navigate("/organization/pos");
      }
    }
  }, [isAuthenticated, isLoading, location.pathname, navigate]);

  const handleTabClick = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    navigate(url);
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "background.default",
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <>
      <Tab.Container defaultActiveKey="pos">
        <Row>
          {isAuthenticated && (
            <Col sm={3}>
              <Box
                className={`${
                  showSidebar
                    ? classes.tabsWithSidebar
                    : isAuthenticated
                    ? classes.tabs
                    : classes.tabsOnAuth
                }`}
                style={{ height: windowHeight - 50 }}
              >
                <Box className={classes.tabsStyle}>
                  <Collapse in={showSidebar}>
                    <Nav variant="pills" className="flex-column">
                      <Nav.Item className={classes.link}>
                        <Nav.Link
                          eventKey="pos"
                          active={location.pathname === "/organization/pos"}
                          className={classes.link}
                          onClick={(e) => handleTabClick(e, "/organization/pos")}
                        >
                          <Box className={classes.link}>
                            <i className="bx bx-desktop"></i> POS
                          </Box>
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link
                          eventKey="inventory"
                          active={location.pathname === "/organization/inventory"}
                          onClick={(e) => handleTabClick(e, "/organization/inventory")}
                        >
                          <Box className={classes.link}>
                            <i className="bx bxs-package"></i> Inventory
                          </Box>
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link
                          eventKey="orders"
                          active={location.pathname === "/organization/orders"}
                          onClick={(e) => handleTabClick(e, "/organization/orders")}
                        >
                          <Box className={classes.link}>
                            <i className="bx bxs-cart"></i> Orders
                          </Box>
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link
                          eventKey="purchasing"
                          active={location.pathname === "/organization/purchasing"}
                          onClick={(e) => handleTabClick(e, "/organization/purchasing")}
                        >
                          <Box className={classes.link}>
                            <i className="bx bxs-truck"></i> Purchasing
                          </Box>
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link
                          eventKey="reports"
                          active={location.pathname === "/organization/reports"}
                          onClick={(e) => handleTabClick(e, "/organization/reports")}
                        >
                          <Box className={classes.link}>
                            <i className="bx bxs-bar-chart-alt-2"></i> Reports
                          </Box>
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link
                          eventKey="users"
                          active={location.pathname === "/organization/users"}
                          onClick={(e) => handleTabClick(e, "/organization/users")}
                        >
                          <Box className={classes.link}>
                            <i className="bx bxs-group"></i> Users
                          </Box>
                        </Nav.Link>
                      </Nav.Item>

                      {isAdmin && (
                        <Nav.Item>
                          <Nav.Link
                            eventKey="organization"
                            active={location.pathname === "/admin/organization"}
                            onClick={(e) => handleTabClick(e, "/admin/organization")}
                          >
                            <Box className={classes.link}>
                              <i className="bx bxs-brightness"></i> Organization
                            </Box>
                          </Nav.Link>
                        </Nav.Item>
                      )}
                      <Nav.Item>
                        <Nav.Link
                          eventKey="settings"
                          active={location.pathname === "/organization/settings"}
                          onClick={(e) => handleTabClick(e, "/organization/settings")}
                        >
                          <Box className={classes.link}>
                            <i className="bx bxs-brightness"></i> Settings
                          </Box>
                        </Nav.Link>
                      </Nav.Item>
                    </Nav>
                  </Collapse>
                </Box>
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
                  />
                </h2>
              </Box>
            </Col>
          )}
          <Col sm={12}>
            <Box
              className={`${
                showSidebar && isAuthenticated
                  ? classes.contentPanWithSidebar
                  : isAuthenticated
                  ? classes.contentPan
                  : classes.contentPanOnAuth
              }`}
            >
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/verify-email" element={<VerifyEmail />} />

                {isAuthenticated && (
                  <>
                    <Route path="/organization/pos" element={<POSEngine />} />
                    <Route path="/organization/inventory" element={<Inventory />} />
                    <Route path="/organization/orders" element={<Order />} />
                    <Route path="/organization/purchasing" element={<PurchasingView />} />
                    <Route path="/organization/reports" element={<ReportsView />} />
                    <Route path="/organization/users" element={<Users />} />
                    <Route path="/organization/settings" element={<Setting />} />
                    {isAdmin && (
                      <Route path="/admin/organization" element={<Organisation />} />
                    )}
                  </>
                )}
                <Route
                  path="/"
                  element={!isAuthenticated ? <Login /> : <POSEngine />}
                />
                <Route
                  path="*"
                  element={!isAuthenticated ? <Login /> : <POSEngine />}
                />
              </Routes>
            </Box>
          </Col>
        </Row>
      </Tab.Container>
    </>
  );
};
export default AppLayout;

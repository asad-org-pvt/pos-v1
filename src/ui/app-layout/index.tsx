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
import {
  Box,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer as MuiDrawer,
  BottomNavigation,
  BottomNavigationAction,
  Divider,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  PointOfSale,
  Inventory2,
  Receipt,
  Settings,
  LocalShipping,
  BarChart,
  Group,
  Business,
} from "@mui/icons-material";
import { useAuthTenant } from "../../context/AuthTenantContext";
import { useResponsive } from "../../hooks/useResponsive";

const AUTH_PATHS = ["/login", "/signup", "/reset-password", "/verify-email"];

// Navigation items config
const NAV_ITEMS = [
  { key: "pos", label: "POS", icon: <PointOfSale />, path: "/organization/pos" },
  { key: "inventory", label: "Inventory", icon: <Inventory2 />, path: "/organization/inventory" },
  { key: "orders", label: "Orders", icon: <Receipt />, path: "/organization/orders" },
  { key: "purchasing", label: "Purchasing", icon: <LocalShipping />, path: "/organization/purchasing" },
  { key: "reports", label: "Reports", icon: <BarChart />, path: "/organization/reports" },
  { key: "users", label: "Users", icon: <Group />, path: "/organization/users" },
  { key: "settings", label: "Settings", icon: <Settings />, path: "/organization/settings" },
];

const BOTTOM_NAV_KEYS = ["pos", "inventory", "orders", "settings"];

const AppLayout: React.FC<ComponentProps> = () => {
  const classes = useStylesFromThemeFunction();
  const navigate = useNavigate();
  const location = useLocation();
  const [showSidebar, setShowSidebar] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { isCompact } = useResponsive();

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
    setMobileDrawerOpen(false);
  };

  const handleBottomNavChange = (_: React.SyntheticEvent, newValue: string) => {
    const item = NAV_ITEMS.find((n) => n.key === newValue);
    if (item) navigate(item.path);
  };

  // Determine active nav key from current path
  const activeNavKey =
    NAV_ITEMS.find((n) => location.pathname === n.path)?.key ||
    (location.pathname === "/admin/organization" ? "organization" : "pos");

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
      {/* ================================================================
          MOBILE: Top App Bar with hamburger menu
          ================================================================ */}
      {isCompact && isAuthenticated && (
        <AppBar
          position="fixed"
          elevation={1}
          sx={{
            bgcolor: "background.paper",
            color: "text.primary",
            borderBottom: "1px solid",
            borderColor: "divider",
            zIndex: (theme) => theme.zIndex.drawer + 1,
          }}
        >
          <Toolbar variant="dense" sx={{ minHeight: 56 }}>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setMobileDrawerOpen(true)}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, flexGrow: 1 }}>
              {NAV_ITEMS.find((n) => n.key === activeNavKey)?.label || "POS"}
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* ================================================================
          MOBILE: Slide-out navigation drawer
          ================================================================ */}
      {isCompact && isAuthenticated && (
        <MuiDrawer
          anchor="left"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          sx={{
            "& .MuiDrawer-paper": {
              width: 280,
              bgcolor: "background.paper",
              color: "text.primary",
            },
          }}
        >
          <Box className={classes.mobileDrawerHeader}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Navigation
            </Typography>
            <IconButton onClick={() => setMobileDrawerOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />
          <Box className={classes.mobileDrawerList}>
            {NAV_ITEMS.map((item) => (
              <Box
                key={item.key}
                className={`${classes.mobileDrawerItem} ${
                  activeNavKey === item.key ? classes.mobileDrawerItemActive : ""
                }`}
                onClick={(e) => handleTabClick(e, item.path)}
              >
                {item.icon}
                {item.label}
              </Box>
            ))}
            {isAdmin && (
              <>
                <Divider sx={{ my: 1 }} />
                <Box
                  className={`${classes.mobileDrawerItem} ${
                    activeNavKey === "organization" ? classes.mobileDrawerItemActive : ""
                  }`}
                  onClick={(e) => handleTabClick(e, "/admin/organization")}
                >
                  <Business />
                  Organization
                </Box>
              </>
            )}
          </Box>
        </MuiDrawer>
      )}

      {/* ================================================================
          DESKTOP: Original fixed sidebar
          ================================================================ */}
      <Tab.Container defaultActiveKey="pos">
        <Row className="g-0 m-0 w-100">
          {isAuthenticated && !isCompact && (
            <Col sm={3}>
              <Box
                className={`${
                  showSidebar
                    ? classes.tabsWithSidebar
                    : isAuthenticated
                    ? classes.tabs
                    : classes.tabsOnAuth
                }`}
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
          <Col xs={12} className="p-0" style={{ minWidth: 0, maxWidth: "100%", width: "100%" }}>
            <Box
              className={`${
                showSidebar && isAuthenticated && !isCompact
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

      {/* ================================================================
          MOBILE: Bottom Navigation Bar
          ================================================================ */}
      {isCompact && isAuthenticated && (
        <BottomNavigation
          value={BOTTOM_NAV_KEYS.includes(activeNavKey) ? activeNavKey : "pos"}
          onChange={handleBottomNavChange}
          showLabels
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: (theme) => theme.zIndex.drawer + 1,
            borderTop: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            height: 60,
            "& .MuiBottomNavigationAction-root": {
              minWidth: 0,
              py: 0.5,
              "&.Mui-selected": {
                color: "primary.main",
              },
            },
            "& .MuiBottomNavigationAction-label": {
              fontSize: "11px",
              fontWeight: 600,
            },
          }}
        >
          {NAV_ITEMS.filter((n) => BOTTOM_NAV_KEYS.includes(n.key)).map((item) => (
            <BottomNavigationAction
              key={item.key}
              label={item.label}
              value={item.key}
              icon={item.icon}
            />
          ))}
        </BottomNavigation>
      )}
    </>
  );
};
export default AppLayout;

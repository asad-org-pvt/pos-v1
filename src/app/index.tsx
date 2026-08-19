import React from "react";
import { Toaster } from "react-hot-toast";
import "bootstrap/dist/css/bootstrap.min.css";
import "../theme/bootstrap-theme-override.css";
import AppLayout from "../ui/app-layout";
import { Provider } from "react-redux";
import store from "../redux/store/store";
import history from "../ui/common/constants";
import { unstable_HistoryRouter as HistoryRouter } from "react-router-dom";
import { AuthTenantProvider } from "../context/AuthTenantContext";
import { SettingsProvider } from "../context/SettingsContext";
import { AppThemeProvider } from "../theme/AppTheme";

function App() {
  return (
    <div>
      <Provider store={store}>
        <AuthTenantProvider>
          <SettingsProvider>
            <AppThemeProvider>
              <Toaster position="bottom-right" reverseOrder={false} />
              <HistoryRouter history={history}>
                <AppLayout />
              </HistoryRouter>
            </AppThemeProvider>
          </SettingsProvider>
        </AuthTenantProvider>
      </Provider>
    </div>
  );
}

export default App;

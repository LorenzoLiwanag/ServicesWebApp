import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import App from "./App";

jest.mock("./pages/ClientDashboardPage.jsx", () => () => <div>Client Dashboard</div>);
jest.mock("./utils/auth.js", () => ({
  getStoredAuthSession: () => ({ token: "test-token", user: { role: "client" } }),
  validateStoredSession: jest.fn(),
}));

const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.hash}`}</div>;
};

test("redirects the retired bookings page to the dashboard bookings section", async () => {
  render(
    <MemoryRouter
      initialEntries={["/my-bookings"]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <App />
      <LocationDisplay />
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(screen.getByTestId("location")).toHaveTextContent("/client-dashboard#my-bookings");
  });
  expect(screen.getByText("Client Dashboard")).toBeInTheDocument();
});

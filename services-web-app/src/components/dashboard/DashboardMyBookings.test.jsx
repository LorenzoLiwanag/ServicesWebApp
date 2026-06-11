import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import DashboardMyBookings from "./DashboardMyBookings";
import { cancelBooking, fetchClientBookings } from "../../api/bookings.js";

jest.mock("../../api/bookings.js", () => ({
  cancelBooking: jest.fn(),
  fetchClientBookings: jest.fn(),
}));

jest.mock("../messaging/ContactModal", () => () => null);
jest.mock("../booking/BookModal", () => () => null);
jest.mock("../booking/BookingStatusBadge", () => ({ status }) => <span>{status}</span>);

const bookings = [
  {
    bookingId: 1,
    status: "pending",
    requestedDate: "2026-06-15",
    requestedTime: "09:00",
    serviceTitle: "Window Cleaning",
    providerName: "Provider One",
    serviceId: 101,
  },
  {
    bookingId: 2,
    status: "accepted",
    requestedDate: "2026-06-16",
    requestedTime: "13:00",
    serviceTitle: "Garden Maintenance",
    providerName: "Provider Two",
    serviceId: 102,
  },
  {
    bookingId: 3,
    status: "completed",
    requestedDate: "2026-06-01",
    serviceTitle: "Home Cleaning",
    providerName: "Provider Three",
    serviceId: 103,
  },
  {
    bookingId: 4,
    status: "completed",
    requestedDate: "2026-05-28",
    serviceTitle: "Plumbing Repair",
    providerName: "Provider Four",
    serviceId: 104,
  },
];

beforeEach(() => {
  fetchClientBookings.mockResolvedValue(bookings);
  cancelBooking.mockResolvedValue({});
});

afterEach(() => {
  jest.clearAllMocks();
});

test("keeps all active and completed bookings inside scrollable dashboard regions", async () => {
  render(<DashboardMyBookings />);

  const activeBookings = await screen.findByLabelText("Active bookings");
  const recentServices = screen.getByLabelText("Recent services");

  expect(activeBookings).toHaveClass("bookings-scroll-region");
  expect(recentServices).toHaveClass("bookings-scroll-region");
  expect(within(activeBookings).getByText("Window Cleaning")).toBeInTheDocument();
  expect(within(activeBookings).getByText("Garden Maintenance")).toBeInTheDocument();
  expect(within(recentServices).getByText("Home Cleaning")).toBeInTheDocument();
  expect(within(recentServices).getByText("Plumbing Repair")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /view all bookings/i })).not.toBeInTheDocument();
});

test("preserves booking cancellation from the dashboard", async () => {
  render(<DashboardMyBookings />);

  const cancelButtons = await screen.findAllByRole("button", { name: "Cancel" });
  fireEvent.click(cancelButtons[0]);
  fireEvent.click(screen.getByRole("button", { name: "Yes, Cancel" }));

  await waitFor(() => {
    expect(cancelBooking).toHaveBeenCalledWith(1);
    expect(fetchClientBookings).toHaveBeenCalledTimes(2);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { LoginPage } from "@/pages/LoginPage";
import { useAuthStore } from "@/store/useAuthStore";
import * as authApi from "@/api/auth";
import { ApiError } from "@/api/client";

vi.mock("@/api/auth", () => ({
  login: vi.fn(),
  logout: vi.fn(),
  getMe: vi.fn(),
  getUsers: vi.fn(),
}));

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    useAuthStore.setState({
      currentUser: null,
      isLoading: false,
      isInitialized: true,
      loginError: null,
    });
    vi.clearAllMocks();
  });

  it("disables submit when fields are empty", () => {
    renderLoginPage();
    expect(screen.getByRole("button", { name: "Inloggen" })).toBeDisabled();
  });

  it("submits login form with credentials", async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockResolvedValue({
      user: {
        id: "1",
        email: "info@websitediewerkt.nl",
        name: "Admin",
        role: "admin",
      },
    });

    renderLoginPage();

    await user.type(screen.getByLabelText("E-mailadres"), "info@websitediewerkt.nl");
    await user.type(screen.getByLabelText("Wachtwoord"), "secret");
    await user.click(screen.getByRole("button", { name: "Inloggen" }));

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith(
        "info@websitediewerkt.nl",
        "secret",
      );
    });
  });

  it("shows error message on failed login", async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockRejectedValue(
      new ApiError("Ongeldig e-mailadres of wachtwoord", 401),
    );

    renderLoginPage();

    await user.type(screen.getByLabelText("E-mailadres"), "wrong@example.com");
    await user.type(screen.getByLabelText("Wachtwoord"), "bad");
    await user.click(screen.getByRole("button", { name: "Inloggen" }));

    await waitFor(() => {
      expect(
        screen.getByText("Ongeldig e-mailadres of wachtwoord"),
      ).toBeInTheDocument();
    });
  });
});

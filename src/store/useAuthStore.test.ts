import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/store/useAuthStore";
import * as authApi from "@/api/auth";
import { ApiError } from "@/api/client";

vi.mock("@/api/auth", () => ({
  login: vi.fn(),
  logout: vi.fn(),
  getMe: vi.fn(),
  getUsers: vi.fn(),
}));

vi.mock("@/store/useProjectContextStore", () => ({
  useProjectContextStore: {
    getState: () => ({
      clearProject: vi.fn(),
    }),
  },
}));

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState({
      currentUser: null,
      isLoading: false,
      isInitialized: false,
      loginError: null,
    });
    vi.clearAllMocks();
  });

  it("restores session on initialize", async () => {
    vi.mocked(authApi.getMe).mockResolvedValue({
      user: {
        id: "1",
        email: "info@websitediewerkt.nl",
        name: "Admin",
        role: "admin",
      },
    });

    await useAuthStore.getState().initialize();

    expect(useAuthStore.getState().currentUser?.email).toBe(
      "info@websitediewerkt.nl",
    );
    expect(useAuthStore.getState().isInitialized).toBe(true);
  });

  it("logs in successfully", async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      user: {
        id: "1",
        email: "info@websitediewerkt.nl",
        name: "Admin",
        role: "admin",
      },
    });

    const success = await useAuthStore
      .getState()
      .login("info@websitediewerkt.nl", "secret");

    expect(success).toBe(true);
    expect(useAuthStore.getState().currentUser?.role).toBe("admin");
    expect(useAuthStore.getState().loginError).toBeNull();
  });

  it("sets login error on failure", async () => {
    vi.mocked(authApi.login).mockRejectedValue(
      new ApiError("Ongeldig e-mailadres of wachtwoord", 401),
    );

    const success = await useAuthStore
      .getState()
      .login("wrong@example.com", "bad");

    expect(success).toBe(false);
    expect(useAuthStore.getState().loginError).toBe(
      "Ongeldig e-mailadres of wachtwoord",
    );
  });

  it("clears user on logout", async () => {
    useAuthStore.setState({
      currentUser: {
        id: "1",
        email: "info@websitediewerkt.nl",
        name: "Admin",
        role: "admin",
      },
    });
    vi.mocked(authApi.logout).mockResolvedValue();

    await useAuthStore.getState().logout();

    expect(useAuthStore.getState().currentUser).toBeNull();
    expect(authApi.logout).toHaveBeenCalled();
  });
});

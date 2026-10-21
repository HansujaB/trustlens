import { createContext, useContext, useEffect, useState } from "react";
import bs58 from "bs58";
import { api, getSession } from "./api";

const WalletAuth = createContext(null);

export function WalletAuthProvider({ children }) {
  const [wallet, setWallet] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    getSession()
      .then((s) => setWallet(s.wallet))
      .catch(() => {});
  }, []);

  async function login() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const provider = window.phantom?.solana || window.solana;
      if (!provider?.connect || !provider?.signMessage) {
        throw new Error(
          "Open TrustLens in a browser with a Solana wallet such as Phantom installed. You can still analyze transactions as a guest.",
        );
      }
      const connected = await provider.connect();
      const challenge = await api("/auth/challenge", "POST", {
        address: connected.publicKey.toString(),
      });
      const signed = await provider.signMessage(
        new TextEncoder().encode(challenge.message),
        "utf8",
      );
      const session = await api("/auth/verify", "POST", {
        signature: bs58.encode(signed.signature),
      });
      setWallet(session.wallet);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await api("/auth/logout", "POST");
      setWallet(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <WalletAuth.Provider
      value={{
        wallet,
        busy,
        error,
        login,
        logout,
        dismissError: () => setError(""),
      }}
    >
      {children}
    </WalletAuth.Provider>
  );
}

export const useWalletAuth = () => useContext(WalletAuth);

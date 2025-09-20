"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type AuthMode = "login" | "register";

type StoredUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
};

const USER_STORAGE_KEY = "fitmotion_user";

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  } catch (error) {
    console.error("Failed to format date", error);
    return value;
  }
}

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const stored = window.localStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredUser;
        setUser(parsed);
        setName(parsed.name);
        setEmail(parsed.email);
      }
    } catch (storageError) {
      console.error("Failed to load stored user", storageError);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    function handleStorage(event: StorageEvent) {
      if (event.key !== USER_STORAGE_KEY) {
        return;
      }

      if (!event.newValue) {
        setUser(null);
        return;
      }

      try {
        const parsed = JSON.parse(event.newValue) as StoredUser;
        setUser(parsed);
        setName(parsed.name);
        setEmail(parsed.email);
      } catch (storageError) {
        console.error("Failed to parse stored user", storageError);
        setUser(null);
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (user) {
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [user]);

  useEffect(() => {
    setError(null);
    setMessage(null);
  }, [mode]);

  const title = mode === "register" ? "Create your Fitmotion account" : "Log in to Fitmotion";
  const subtitle =
    mode === "register"
      ? "Sign up once to keep your workout history synced across devices."
      : "Log back in to pick up right where you left off.";

  const submitLabel = loading
    ? "One moment…"
    : mode === "register"
    ? "Create account"
    : "Log in";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword || (mode === "register" && !trimmedName)) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "register"
            ? { name: trimmedName, email: trimmedEmail, password: trimmedPassword }
            : { email: trimmedEmail, password: trimmedPassword }
        )
      });

      const result = (await response.json()) as { user?: StoredUser; error?: string };

      if (!response.ok) {
        setError(result.error ?? "We couldn’t complete that request.");
        return;
      }

      if (result.user) {
        setUser(result.user);
        setName(result.user.name);
        setEmail(result.user.email);
        setMessage(mode === "register" ? "Account created! You’re signed in." : "Welcome back!");
        setPassword("");
      }
    } catch (submitError) {
      console.error(`Failed to ${mode}`, submitError);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const lastSynced = useMemo(() => formatDateTime(user?.updatedAt), [user?.updatedAt]);
  const lastLogin = useMemo(() => formatDateTime(user?.lastLoginAt ?? user?.updatedAt), [
    user?.lastLoginAt,
    user?.updatedAt
  ]);

  function handleSignOut() {
    setUser(null);
    setMessage("You’re signed out.");
    setPassword("");
  }

  return (
    <div className="auth-page">
      <div className="wrap auth-wrap">
        <header className="auth-header">
          <Link className="auth-logo" href="/">
            <span className="sr-only">Return home</span>
            <Image
              alt="Fitmotion"
              className="auth-logo__image"
              height={120}
              priority
              src="/fitmotion-logo.svg"
              width={120}
            />
          </Link>
          <h1>{title}</h1>
          <p className="auth-subtitle">{subtitle}</p>
          <div className="auth-toggle">
            <button
              className={mode === "login" ? "active" : undefined}
              onClick={() => setMode("login")}
              type="button"
              disabled={loading}
            >
              Log in
            </button>
            <button
              className={mode === "register" ? "active" : undefined}
              onClick={() => setMode("register")}
              type="button"
              disabled={loading}
            >
              Register
            </button>
          </div>
        </header>

        <div className="auth-grid">
          <div className="card auth-card">
            <form className="auth-form" onSubmit={handleSubmit}>
              {error && (
                <div className="banner error auth-banner">
                  <span>{error}</span>
                </div>
              )}
              {message && (
                <div className="banner success auth-banner">
                  <span>{message}</span>
                </div>
              )}

              {mode === "register" && (
                <label className="auth-field" htmlFor="auth-name">
                  <span>Name</span>
                  <input
                    autoComplete="name"
                    className="in"
                    id="auth-name"
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    type="text"
                    value={name}
                    disabled={loading}
                  />
                </label>
              )}

              <label className="auth-field" htmlFor="auth-email">
                <span>Email</span>
                <input
                  autoComplete="email"
                  className="in"
                  id="auth-email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                  disabled={loading}
                />
              </label>

              <label className="auth-field" htmlFor="auth-password">
                <span>Password</span>
                <input
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  className="in"
                  id="auth-password"
                  minLength={8}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  disabled={loading}
                />
              </label>

              <button className="btn primary" disabled={loading} type="submit">
                {submitLabel}
              </button>
            </form>
          </div>

          {user ? (
            <aside className="card auth-profile">
              <h2>Your saved profile</h2>
              <dl className="auth-profile__list">
                <div>
                  <dt>Name</dt>
                  <dd>{user.name}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{user.email}</dd>
                </div>
                <div>
                  <dt>Last login</dt>
                  <dd>{lastLogin}</dd>
                </div>
                <div>
                  <dt>Last synced</dt>
                  <dd>{lastSynced}</dd>
                </div>
              </dl>
              <div className="auth-profile__actions">
                <button className="btn ghost" onClick={handleSignOut} type="button">
                  Sign out
                </button>
                <Link className="btn ghost" href="/">
                  Back to tracker
                </Link>
              </div>
            </aside>
          ) : (
            <aside className="card auth-profile auth-profile--empty">
              <h2>Why create an account?</h2>
              <ul>
                <li>Back up your workouts and reload them on any device.</li>
                <li>Keep your active week synced with your saved archive.</li>
                <li>Fast login means you’re logging sets in seconds.</li>
              </ul>
              <Link className="btn ghost" href="/">
                Preview the tracker
              </Link>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

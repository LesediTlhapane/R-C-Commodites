import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

interface RouterContextType {
  pathname: string;
  navigate: (path: string, options?: { replace?: boolean }) => void;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [pathname, setPathname] = useState<string>(() => window.location.pathname || "/");

  useEffect(() => {
    const handleLocationChange = () => {
      setPathname(window.location.pathname || "/");
    };

    window.addEventListener("popstate", handleLocationChange);
    window.addEventListener("rc_navigate", handleLocationChange);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("rc_navigate", handleLocationChange);
    };
  }, []);

  const navigate = useCallback((path: string, options?: { replace?: boolean }) => {
    if (options?.replace) {
      window.history.replaceState(null, "", path);
    } else {
      window.history.pushState(null, "", path);
    }
    setPathname(window.location.pathname || "/");
    window.dispatchEvent(new Event("rc_navigate"));
  }, []);

  return (
    <RouterContext.Provider value={{ pathname, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error("useRouter must be used within a RouterProvider");
  }
  return context;
}

export interface LinkProps {
  href: string;
  replace?: boolean;
  className?: string;
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  title?: string;
  id?: string;
  style?: React.CSSProperties;
  target?: string;
  rel?: string;
}

export function Link({ href, replace = false, children, onClick, ...rest }: LinkProps) {
  const { navigate } = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);

    // If external or hash on same page, let browser handle normally
    if (href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      return;
    }

    if (href.startsWith("#")) {
      return;
    }

    // Don't intercept ctrl/cmd click (new tab)
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) {
      return;
    }

    e.preventDefault();
    navigate(href, { replace });
  };

  return (
    <a href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}

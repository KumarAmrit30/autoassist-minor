// Custom hook for handling post-authentication redirects

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function useRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectAfterAuth = useCallback(
    (defaultPath: string = "/dashboard") => {
      // Get the return URL from query params (set by middleware)
      const returnUrl = searchParams.get("return");

      // Validate the return URL to prevent open redirect attacks
      const isValidReturnUrl =
        returnUrl &&
        returnUrl.startsWith("/") &&
        !returnUrl.startsWith("//") &&
        !returnUrl.includes("http://") &&
        !returnUrl.includes("https://");

      const targetUrl = isValidReturnUrl ? returnUrl : defaultPath;

      // Use replace instead of push to prevent going back to login
      router.replace(targetUrl);
    },
    [router, searchParams]
  );

  const redirectToLogin = useCallback(
    (currentPath?: string) => {
      const loginUrl = currentPath
        ? `/login?return=${encodeURIComponent(currentPath)}`
        : "/login";

      router.replace(loginUrl);
    },
    [router]
  );

  return {
    redirectAfterAuth,
    redirectToLogin,
  };
}

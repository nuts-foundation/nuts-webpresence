import { useEffect } from "react";

export default function LinkedInStream() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://platform.linkedin.com/badges/js/profile.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="fixed top-24 right-4 w-80">
      <div
        className="LI-profile-badge"
        data-version="v1"
        data-size="medium"
        data-locale="nl_NL"
        data-type="company"
        data-theme="light"
        data-vanity="nuts-foundation"
      >
        <a
          className="LI-simple-link"
          href="https://nl.linkedin.com/company/nuts-foundation"
        >
          Nuts Foundation
        </a>
      </div>
    </div>
  );
}

import { logoutAction } from "./actions";

import styles from "./LogoutButton.module.css";

export const LogoutButton = () => {
  return (
    <form action={logoutAction}>
      <button type="submit" className={styles.button}>
        Abmelden
      </button>
    </form>
  );
};

LogoutButton.displayName = "LogoutButton";

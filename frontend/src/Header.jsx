import styles from './Header.module.css'
export default function Header({darkMode,setDarkMode}) {
    return (
        <nav className={styles.navbar}>
            <h1 className={styles.logo}>OnePet</h1>
            <div>
                <button className={styles.toggle} onClick={() => setDarkMode(!darkMode)}>
                    {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
                </button>
                <span className={styles.connect}>
                    Wallet ID
                </span>
                <span className={styles.token}>
                    TOKEN:1
                </span>
            </div>
        </nav>
    )
}
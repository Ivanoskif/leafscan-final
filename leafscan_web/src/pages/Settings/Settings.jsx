import { useState } from 'react';
import { Globe, Bell, Shield, Check, Save, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLang } from '../../context/LanguageContext';
import './Settings.css';

export default function Settings() {
    const { isDark, toggleTheme } = useTheme();
    const { lang, setLang, t }    = useLang();

    const [emailNotif, setEmailNotif] = useState(true);
    const [pushNotif,  setPushNotif]  = useState(false);
    const [twoFactor,  setTwoFactor]  = useState(false);
    const [sessionLog, setSessionLog] = useState(true);
    const [saved,      setSaved]      = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    return (
        <div className="settings-page">

            <div className="page-header">
                <div>
                    <h1 className="page-title">{t('settings.title')}</h1>
                    <p className="page-subtitle">{t('settings.subtitle')}</p>
                </div>
            </div>

            <div className="settings-sections">

                {/* Language */}
                <div className="settings-card">
                    <div className="settings-section-header">
                        <div className="settings-section-icon settings-section-icon--orange">
                            <Globe size={17} strokeWidth={1.8} />
                        </div>
                        <div>
                            <h2 className="settings-section-title">{t('settings.language')}</h2>
                            <p className="settings-section-desc">{t('settings.languageDesc')}</p>
                        </div>
                    </div>
                    <div className="settings-card-body">
                        <div className="lang-options">
                            <button
                                className={`lang-btn ${lang === 'en' ? 'lang-btn--active' : ''}`}
                                onClick={() => setLang('en')}
                            >
                                <span className="lang-flag">🇬🇧</span> English
                            </button>
                            <button
                                className={`lang-btn ${lang === 'mk' ? 'lang-btn--active' : ''}`}
                                onClick={() => setLang('mk')}
                            >
                                <span className="lang-flag">🇲🇰</span> Македонски
                            </button>
                        </div>
                    </div>
                </div>

                {/* Appearance */}
                <div className="settings-card">
                    <div className="settings-section-header">
                        <div className="settings-section-icon settings-section-icon--teal">
                            {isDark ? <Moon size={17} strokeWidth={1.8} /> : <Sun size={17} strokeWidth={1.8} />}
                        </div>
                        <div>
                            <h2 className="settings-section-title">{t('settings.appearance')}</h2>
                            <p className="settings-section-desc">{t('settings.appearanceDesc')}</p>
                        </div>
                    </div>
                    <div className="settings-card-body">
                        <ToggleRow
                            label={isDark ? t('settings.darkMode') : t('settings.lightMode')}
                            sub={t('settings.darkModeSub')}
                            checked={isDark}
                            onChange={toggleTheme}
                        />
                        <div className="settings-divider" />
                        <div className="theme-picker">
                            <div
                                className={`theme-option ${isDark ? 'theme-option--active' : ''}`}
                                onClick={() => !isDark && toggleTheme()}
                            >
                                <div className="theme-thumb theme-thumb--dark">
                                    <div className="theme-thumb-sidebar theme-thumb-sidebar--dark" />
                                    <div className="theme-thumb-content">
                                        <div className="theme-thumb-bar" />
                                        <div className="theme-thumb-bar theme-thumb-bar--short" />
                                    </div>
                                </div>
                                <span>{t('settings.darkMode')}</span>
                            </div>
                            <div
                                className={`theme-option ${!isDark ? 'theme-option--active' : ''}`}
                                onClick={() => isDark && toggleTheme()}
                            >
                                <div className="theme-thumb theme-thumb--light">
                                    <div className="theme-thumb-sidebar theme-thumb-sidebar--light" />
                                    <div className="theme-thumb-content theme-thumb-content--light">
                                        <div className="theme-thumb-bar theme-thumb-bar--light" />
                                        <div className="theme-thumb-bar theme-thumb-bar--short theme-thumb-bar--light" />
                                    </div>
                                </div>
                                <span>{t('settings.lightMode')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="settings-card">
                    <div className="settings-section-header">
                        <div className="settings-section-icon settings-section-icon--green">
                            <Bell size={17} strokeWidth={1.8} />
                        </div>
                        <div>
                            <h2 className="settings-section-title">{t('settings.notifications')}</h2>
                            <p className="settings-section-desc">{t('settings.notificationsDesc')}</p>
                        </div>
                    </div>
                    <div className="settings-card-body">
                        <ToggleRow
                            label={t('settings.emailNotif')}
                            sub={t('settings.emailNotifSub')}
                            checked={emailNotif}
                            onChange={setEmailNotif}
                        />
                        <div className="settings-divider" />
                        <ToggleRow
                            label={t('settings.pushNotif')}
                            sub={t('settings.pushNotifSub')}
                            checked={pushNotif}
                            onChange={setPushNotif}
                        />
                    </div>
                </div>

                {/* Security */}
                <div className="settings-card">
                    <div className="settings-section-header">
                        <div className="settings-section-icon settings-section-icon--red">
                            <Shield size={17} strokeWidth={1.8} />
                        </div>
                        <div>
                            <h2 className="settings-section-title">{t('settings.security')}</h2>
                            <p className="settings-section-desc">{t('settings.securityDesc')}</p>
                        </div>
                    </div>
                    <div className="settings-card-body">
                        <ToggleRow
                            label={t('settings.twoFactor')}
                            sub={t('settings.twoFactorSub')}
                            checked={twoFactor}
                            onChange={setTwoFactor}
                        />
                        <div className="settings-divider" />
                        <ToggleRow
                            label={t('settings.sessionLog')}
                            sub={t('settings.sessionLogSub')}
                            checked={sessionLog}
                            onChange={setSessionLog}
                        />
                    </div>
                </div>

            </div>

            <div className="settings-footer">
                <button
                    className={`btn btn--lg ${saved ? 'btn--saved' : 'btn--primary'}`}
                    onClick={handleSave}
                >
                    {saved
                        ? <><Check size={17} strokeWidth={2.5} /> {t('settings.savedBtn')}</>
                        : <><Save  size={17} strokeWidth={1.8} /> {t('settings.saveBtn')}</>
                    }
                </button>
            </div>

        </div>
    );
}

function ToggleRow({ label, sub, checked, onChange }) {
    return (
        <div className="toggle-row">
            <div>
                <div className="toggle-label">{label}</div>
                <div className="toggle-sub">{sub}</div>
            </div>
            <button
                className={`toggle ${checked ? 'toggle--on' : ''}`}
                onClick={() => onChange(!checked)}
                role="switch"
                aria-checked={checked}
            >
                <span className="toggle-thumb" />
            </button>
        </div>
    );
}
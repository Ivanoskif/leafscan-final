import { createContext, useContext, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// LanguageContext — MK / EN
// Usage:
//   const { lang, setLang, t } = useLang();
//   t('dashboard.title')  → 'Dashboard' or 'Контролна табла'
//
// Wrap your app root with <LanguageProvider>.
// ─────────────────────────────────────────────────────────────────────────────

const TRANSLATIONS = {
    en: {
        // ── Navigation ───────────────────────────────────────────────────────────
        nav: {
            dashboard:       'Dashboard',
            analyses:        'Analysis History',
            diseases:        'Diseases',
            plants:          'Plants',
            users:           'Users',
            statistics:      'Statistics',
            settings:        'Settings',
            profile:         'Profile',
            logout:          'Log out',
        },

        // ── Common ────────────────────────────────────────────────────────────────
        common: {
            save:            'Save',
            cancel:          'Cancel',
            delete:          'Delete',
            edit:            'Edit',
            add:             'Add',
            search:          'Search',
            close:           'Close',
            export:          'Export',
            viewAll:         'View All',
            actions:         'Actions',
            loading:         'Loading…',
            noResults:       'No results found',
            confirm:         'Confirm',
            yes:             'Yes',
            no:              'No',
            total:           'Total',
            status:          'Status',
            name:            'Name',
            email:           'Email',
            date:            'Date',
            type:            'Type',
            all:             'All',
        },

        // ── Dashboard ─────────────────────────────────────────────────────────────
        dashboard: {
            title:             'Dashboard',
            subtitle:          "Welcome back, Admin. Here's what's happening.",
            totalAnalyses:     'Total Analyses',
            totalUsers:        'Total Users',
            diseasesDetected:  'Diseases Detected',
            accuracyRate:      'Accuracy Rate',
            monthlyTrend:      'Monthly Trend',
            diseaseDistribution: 'Disease Distribution',
            recentAnalyses:    'Recent Analyses',
            topDetected:       'Top Detected Diseases',
        },

        // ── Analysis History ──────────────────────────────────────────────────────
        analyses: {
            title:             'Analysis History',
            subtitle:          'View all previous plant disease analyses',
            exportBtn:         'Export History',
            healthy:           'Healthy',
            infected:          'Infected',
            allResults:        'All Results',
            searchPlaceholder: 'Search by ID, plant or disease…',
            results:           'results',
            id:                'ID',
            plant:             'Plant',
            disease:           'Disease',
            confidence:        'Confidence',
            result:            'Result',
            noAnalyses:        'No analyses found',
            noAnalysesSub:     'Try adjusting your search or filter',
            deleteTitle:       'Delete Analysis',
            deleteDesc:        'Are you sure you want to delete',
            deleteWarn:        'This cannot be undone.',
            aiConfidence:      'AI Confidence',
            showingFor:        'Showing analyses for',
            clearFilter:       'Clear filter ×',
        },

        // ── Diseases ──────────────────────────────────────────────────────────────
        diseases: {
            title:             'Diseases',
            subtitle:          'Manage all plant diseases in the system',
            addBtn:            'Add Disease',
            searchPlaceholder: 'Search diseases…',
            allSeverity:       'All Severity',
            low:               'Low',
            medium:            'Medium',
            high:              'High',
            severity:          'Severity',
            category:          'Category',
            affectedPlants:    'Affected Plants',
            symptoms:          'Symptoms',
            treatment:         'Treatment',
            noDiseasesTitle:   'No diseases found',
            noDiseasesSub:     'Try adjusting your search or filter',
            deleteTitle:       'Delete Disease',
            deleteDesc:        'Are you sure you want to delete',
            deleteWarn:        'This cannot be undone.',
            addTitle:          'Add Disease',
            editTitle:         'Edit Disease',
            diseaseName:       'Disease Name',
            diseaseCategory:   'Category',
            optional:          'optional',
        },

        // ── Plants ────────────────────────────────────────────────────────────────
        plants: {
            title:             'Plants',
            subtitle:          'Manage all plants in the system',
            addBtn:            'Add Plant',
            searchPlaceholder: 'Search plants…',
            allTypes:          'All Types',
            scientificName:    'Scientific Name',
            region:            'Region',
            noPlantsTitle:     'No plants found',
            noPlantsSub:       'Try adjusting your search or filter',
            deleteTitle:       'Delete Plant',
            deleteDesc:        'Are you sure you want to delete',
            deleteWarn:        'This cannot be undone.',
            addTitle:          'Add Plant',
            editTitle:         'Edit Plant',
            plantName:         'Plant Name',
            description:       'Description',
            image:             'Image',
        },

        // ── Users ─────────────────────────────────────────────────────────────────
        users: {
            title:             'Users',
            subtitle:          'Manage all registered users',
            addBtn:            'Add User',
            searchPlaceholder: 'Search users…',
            allUsers:          'All Users',
            admins:            'Admins',
            activeUsers:       'Active',
            inactiveUsers:     'Inactive',
            admin:             'Admin',
            user:              'User',
            active:            'Active',
            inactive:          'Inactive',
            joined:            'Joined',
            role:              'Role',
            noUsersTitle:      'No users found',
            noUsersSub:        'Try adjusting your search or filter',
            deleteTitle:       'Delete User',
            deleteDesc:        'Are you sure you want to delete',
            deleteWarn:        'This cannot be undone.',
            viewAnalyses:      'View Analyses',
            analyses:          'Analyses',
        },

        // ── Statistics ────────────────────────────────────────────────────────────
        statistics: {
            title:             'Statistics',
            subtitle:          'Platform analytics and insights',
            last7days:         'Last 7 days',
            last30days:        'Last 30 days',
            last3months:       'Last 3 months',
            last12months:      'Last 12 months',
            healthy:           'Healthy',
            infected:          'Infected',
            analysesOverTime:  'Analyses Over Time',
            diseaseDistribution: 'Disease Distribution',
            totalAnalyses:     'Total Analyses',
            infectionRate:     'Infection Rate',
            avgConfidence:     'Avg. Confidence',
            activePlants:      'Active Plants',
        },

        // ── Settings ──────────────────────────────────────────────────────────────
        settings: {
            title:             'General Settings',
            subtitle:          'System-wide preferences for the admin panel',
            language:          'Language',
            languageDesc:      'Choose the display language for the admin panel interface',
            appearance:        'Appearance',
            appearanceDesc:    'Toggle between dark and light theme',
            notifications:     'Notifications',
            notificationsDesc: 'Control how and when you receive alerts',
            security:          'Security',
            securityDesc:      'Account security and session preferences',
            emailNotif:        'Email Notifications',
            emailNotifSub:     'Receive email alerts for new analyses',
            pushNotif:         'Push Notifications',
            pushNotifSub:      'Browser push notifications for critical alerts',
            twoFactor:         'Two-Factor Authentication',
            twoFactorSub:      'Require a verification code on every login',
            sessionLog:        'Session Activity Log',
            sessionLogSub:     'Keep a log of all admin login sessions',
            saveBtn:           'Save All Changes',
            savedBtn:          'Changes Saved!',
            darkMode:          'Dark Mode',
            darkModeSub:       'Switch between dark and light interface',
            lightMode:         'Light Mode',
        },

        // ── Profile ───────────────────────────────────────────────────────────────
        profile: {
            title:             'Admin Profile',
            subtitle:          'Manage your personal information and password',
            fullName:          'Full Name',
            phone:             'Phone',
            bio:               'Bio',
            updateBtn:         'Update Profile',
            savedBtn:          'Saved',
            changePassword:    'Change Password',
            currentPw:         'Current Password',
            newPw:             'New Password',
            confirmPw:         'Confirm Password',
            changePwBtn:       'Change Password',
            pwSuccess:         'Password changed successfully!',
            pwErrorRequired:   'All password fields are required.',
            pwErrorLength:     'New password must be at least 6 characters.',
            pwErrorMatch:      'New passwords do not match.',
        },

        // ── Login ─────────────────────────────────────────────────────────────────
        login: {
            title:             'Admin Login',
            subtitle:          'Sign in to your admin account',
            emailLabel:        'Email address',
            passwordLabel:     'Password',
            forgotPassword:    'Forgot password?',
            signInBtn:         'Sign In',
            signingIn:         'Signing in…',
            errorEmpty:        'Please fill in all fields.',
            feature1:          'AI Disease Detection',
            feature2:          'Real-time Analytics',
            feature3:          'User Management',
            feature4:          'Analysis History',
            heroTitle:         'Intelligent Plant Disease Detection',
            heroSub:           'AI-powered admin panel for managing diseases, users and analysis history.',
        },
    },

    // ══════════════════════════════════════════════════════════════════════════
    mk: {
        // ── Навигација ────────────────────────────────────────────────────────────
        nav: {
            dashboard:       'Контролна табла',
            analyses:        'Историја на анализи',
            diseases:        'Болести',
            plants:          'Растенија',
            users:           'Корисници',
            statistics:      'Статистики',
            settings:        'Поставки',
            profile:         'Профил',
            logout:          'Одјава',
        },

        // ── Општо ─────────────────────────────────────────────────────────────────
        common: {
            save:            'Зачувај',
            cancel:          'Откажи',
            delete:          'Избриши',
            edit:            'Уреди',
            add:             'Додај',
            search:          'Пребарај',
            close:           'Затвори',
            export:          'Извоз',
            viewAll:         'Прикажи сè',
            actions:         'Акции',
            loading:         'Вчитување…',
            noResults:       'Нема резултати',
            confirm:         'Потврди',
            yes:             'Да',
            no:              'Не',
            total:           'Вкупно',
            status:          'Статус',
            name:            'Име',
            email:           'Е-пошта',
            date:            'Датум',
            type:            'Тип',
            all:             'Сите',
        },

        // ── Контролна табла ───────────────────────────────────────────────────────
        dashboard: {
            title:             'Контролна табла',
            subtitle:          'Добредојдовте, Администратор. Еве што се случува.',
            totalAnalyses:     'Вкупно анализи',
            totalUsers:        'Вкупно корисници',
            diseasesDetected:  'Откриени болести',
            accuracyRate:      'Точност',
            monthlyTrend:      'Месечен тренд',
            diseaseDistribution: 'Распределба на болести',
            recentAnalyses:    'Последни анализи',
            topDetected:       'Најчесто откривани болести',
        },

        // ── Историја на анализи ───────────────────────────────────────────────────
        analyses: {
            title:             'Историја на анализи',
            subtitle:          'Прегледај ги сите претходни анализи на болести',
            exportBtn:         'Извоз на историја',
            healthy:           'Здраво',
            infected:          'Заразено',
            allResults:        'Сите резултати',
            searchPlaceholder: 'Пребарај по ID, растение или болест…',
            results:           'резултати',
            id:                'ID',
            plant:             'Растение',
            disease:           'Болест',
            confidence:        'Доверливост',
            result:            'Резултат',
            noAnalyses:        'Нема пронајдени анализи',
            noAnalysesSub:     'Обидете се да ги прилагодите вашите филтри',
            deleteTitle:       'Избриши анализа',
            deleteDesc:        'Дали сте сигурни дека сакате да ја избришете',
            deleteWarn:        'Ова не може да се поврати.',
            aiConfidence:      'AI доверливост',
            showingFor:        'Прикажување анализи за',
            clearFilter:       'Отстрани филтер ×',
        },

        // ── Болести ───────────────────────────────────────────────────────────────
        diseases: {
            title:             'Болести',
            subtitle:          'Управувај со сите болести на растенија во системот',
            addBtn:            'Додај болест',
            searchPlaceholder: 'Пребарај болести…',
            allSeverity:       'Сите тежини',
            low:               'Ниска',
            medium:            'Средна',
            high:              'Висока',
            severity:          'Тежина',
            category:          'Категорија',
            affectedPlants:    'Засегнати растенија',
            symptoms:          'Симптоми',
            treatment:         'Третман',
            noDiseasesTitle:   'Нема пронајдени болести',
            noDiseasesSub:     'Обидете се да ги прилагодите вашите филтри',
            deleteTitle:       'Избриши болест',
            deleteDesc:        'Дали сте сигурни дека сакате да ја избришете',
            deleteWarn:        'Ова не може да се поврати.',
            addTitle:          'Додај болест',
            editTitle:         'Уреди болест',
            diseaseName:       'Ime на болест',
            diseaseCategory:   'Категорија',
            optional:          'опционално',
        },

        // ── Растенија ─────────────────────────────────────────────────────────────
        plants: {
            title:             'Растенија',
            subtitle:          'Управувај со сите растенија во системот',
            addBtn:            'Додај растение',
            searchPlaceholder: 'Пребарај растенија…',
            allTypes:          'Сите типови',
            scientificName:    'Научно име',
            region:            'Регион',
            noPlantsTitle:     'Нема пронајдени растенија',
            noPlantsSub:       'Обидете се да ги прилагодите вашите филтри',
            deleteTitle:       'Избриши растение',
            deleteDesc:        'Дали сте сигурни дека сакате да го избришете',
            deleteWarn:        'Ова не може да се поврати.',
            addTitle:          'Додај растение',
            editTitle:         'Уреди растение',
            plantName:         'Име на растение',
            description:       'Опис',
            image:             'Слика',
        },

        // ── Корисници ─────────────────────────────────────────────────────────────
        users: {
            title:             'Корисници',
            subtitle:          'Управувај со сите регистрирани корисници',
            addBtn:            'Додај корисник',
            searchPlaceholder: 'Пребарај корисници…',
            allUsers:          'Сите корисници',
            admins:            'Администратори',
            activeUsers:       'Активни',
            inactiveUsers:     'Неактивни',
            admin:             'Администратор',
            user:              'Корисник',
            active:            'Активен',
            inactive:          'Неактивен',
            joined:            'Зачленет',
            role:              'Улога',
            noUsersTitle:      'Нема пронајдени корисници',
            noUsersSub:        'Обидете се да ги прилагодите вашите филтри',
            deleteTitle:       'Избриши корисник',
            deleteDesc:        'Дали сте сигурни дека сакате да го избришете',
            deleteWarn:        'Ова не може да се поврати.',
            viewAnalyses:      'Прикажи анализи',
            analyses:          'Анализи',
        },

        // ── Статистики ────────────────────────────────────────────────────────────
        statistics: {
            title:             'Статистики',
            subtitle:          'Аналитика и увиди за платформата',
            last7days:         'Последни 7 дена',
            last30days:        'Последни 30 дена',
            last3months:       'Последни 3 месеци',
            last12months:      'Последни 12 месеци',
            healthy:           'Здраво',
            infected:          'Заразено',
            analysesOverTime:  'Анализи низ времето',
            diseaseDistribution: 'Распределба на болести',
            totalAnalyses:     'Вкупно анализи',
            infectionRate:     'Стапка на инфекција',
            avgConfidence:     'Просечна доверливост',
            activePlants:      'Активни растенија',
        },

        // ── Поставки ──────────────────────────────────────────────────────────────
        settings: {
            title:             'Општи поставки',
            subtitle:          'Системски преференци за административниот панел',
            language:          'Јазик',
            languageDesc:      'Изберете јазик за приказ на административниот панел',
            appearance:        'Изглед',
            appearanceDesc:    'Префрлете помеѓу темна и светла тема',
            notifications:     'Известувања',
            notificationsDesc: 'Контролирајте кога и како добивате известувања',
            security:          'Безбедност',
            securityDesc:      'Безбедност на сметката и сесиски преференци',
            emailNotif:        'Известувања по е-пошта',
            emailNotifSub:     'Примај известувања по е-пошта за нови анализи',
            pushNotif:         'Push известувања',
            pushNotifSub:      'Известувања во прелистувачот за критични предупредувања',
            twoFactor:         'Двофакторска автентикација',
            twoFactorSub:      'Побарај верификациски код на секоја најава',
            sessionLog:        'Дневник на активноста на сесии',
            sessionLogSub:     'Чувај дневник на сите администраторски сесии',
            saveBtn:           'Зачувај ги промените',
            savedBtn:          'Промените се зачувани!',
            darkMode:          'Темен режим',
            darkModeSub:       'Префрлете помеѓу темен и светол интерфејс',
            lightMode:         'Светол режим',
        },

        // ── Профил ────────────────────────────────────────────────────────────────
        profile: {
            title:             'Администраторски профил',
            subtitle:          'Управувај со личните информации и лозинката',
            fullName:          'Целосно ime',
            phone:             'Телефон',
            bio:               'Биографија',
            updateBtn:         'Ажурирај профил',
            savedBtn:          'Зачувано',
            changePassword:    'Промени лозинка',
            currentPw:         'Тековна лозинка',
            newPw:             'Нова лозинка',
            confirmPw:         'Потврди лозинка',
            changePwBtn:       'Промени лозинка',
            pwSuccess:         'Лозинката е успешно сменета!',
            pwErrorRequired:   'Сите полиња за лозинка се задолжителни.',
            pwErrorLength:     'Новата лозинка мора да содржи најмалку 6 знаци.',
            pwErrorMatch:      'Новите лозинки не се совпаѓаат.',
        },

        // ── Најава ────────────────────────────────────────────────────────────────
        login: {
            title:             'Администраторска најава',
            subtitle:          'Најавете се на вашата администраторска сметка',
            emailLabel:        'Е-пошта адреса',
            passwordLabel:     'Лозинка',
            forgotPassword:    'Заборавена лозинка?',
            signInBtn:         'Најави се',
            signingIn:         'Најавување…',
            errorEmpty:        'Ве молиме пополнете ги сите полиња.',
            feature1:          'AI Откривање болести',
            feature2:          'Аналитика во реално време',
            feature3:          'Управување со корисници',
            feature4:          'Историја на анализи',
            heroTitle:         'Интелигентно откривање болести на растенија',
            heroSub:           'AI-базиран административен панел за управување со болести, корисници и историја на анализи.',
        },
    },
};

// ─────────────────────────────────────────────────────────────────────────────
const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState(() => {
        return localStorage.getItem('leafscan-lang') || 'en';
    });

    const changeLang = (newLang) => {
        setLang(newLang);
        localStorage.setItem('leafscan-lang', newLang);
    };

    // t('settings.title') → translated string
    const t = (key) => {
        const parts = key.split('.');
        let val = TRANSLATIONS[lang];
        for (const p of parts) {
            val = val?.[p];
        }
        // fallback to English if key missing
        if (val === undefined) {
            let fb = TRANSLATIONS['en'];
            for (const p of parts) fb = fb?.[p];
            return fb ?? key;
        }
        return val;
    };

    return (
        <LanguageContext.Provider value={{ lang, setLang: changeLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLang() {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLang must be used inside <LanguageProvider>');
    return ctx;
}
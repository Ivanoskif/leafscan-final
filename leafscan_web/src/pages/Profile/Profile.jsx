import { useState } from 'react';
import { UserCircle, Lock, Check, Save, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LanguageContext';
import './Profile.css';

export default function Profile() {
  const { user } = useAuth();
  const { t }    = useLang();

  const [fullName, setFullName] = useState(user?.full_name || 'Admin User');
  const [email,    setEmail]    = useState(user?.email     || 'admin@leafscan.ai');
  const [phone,    setPhone]    = useState('+389 70 123 456');
  const [bio,      setBio]      = useState('Plant disease detection system administrator. Passionate about agricultural technology and AI solutions.');
  const [profileSaved, setProfileSaved] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurr,  setShowCurr]  = useState(false);
  const [showNew,   setShowNew]   = useState(false);
  const [showConf,  setShowConf]  = useState(false);
  const [pwError,   setPwError]   = useState('');
  const [pwSaved,   setPwSaved]   = useState(false);

  const initial = fullName?.[0]?.toUpperCase() || 'A';

  const handleProfileSave = () => {
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handlePasswordChange = () => {
    setPwError('');
    if (!currentPw || !newPw || !confirmPw) {
      setPwError(t('profile.pwErrorRequired')); return;
    }
    if (newPw.length < 6) {
      setPwError(t('profile.pwErrorLength')); return;
    }
    if (newPw !== confirmPw) {
      setPwError(t('profile.pwErrorMatch')); return;
    }
    setPwSaved(true);
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    setTimeout(() => setPwSaved(false), 2500);
  };

  return (
      <div className="profile-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">{t('profile.title')}</h1>
            <p className="page-subtitle">{t('profile.subtitle')}</p>
          </div>
        </div>

        {/* Profile card */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-card-icon">
              <UserCircle size={18} strokeWidth={1.8} color="var(--orange)" />
            </div>
            <h2 className="profile-card-title">{t('profile.title')}</h2>
          </div>

          <div className="profile-avatar-row">
            <div className="profile-avatar">{initial}</div>
            <div>
              <div className="profile-avatar-name">{fullName}</div>
              <div className="profile-avatar-email">{email}</div>
            </div>
          </div>

          <div className="profile-form">
            <div className="form-row-2">
              <div className="form-field">
                <label className="form-label">{t('profile.fullName')}</label>
                <input className="form-input" value={fullName}
                       onChange={e => setFullName(e.target.value)} placeholder="Full name" />
              </div>
              <div className="form-field">
                <label className="form-label">{t('common.email')}</label>
                <input className="form-input" type="email" value={email}
                       onChange={e => setEmail(e.target.value)} placeholder="Email address" />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">{t('profile.phone')}</label>
              <input className="form-input" value={phone}
                     onChange={e => setPhone(e.target.value)} placeholder="+389 70 000 000" />
            </div>

            <div className="form-field">
              <label className="form-label">{t('profile.bio')}</label>
              <textarea className="form-input form-textarea" value={bio}
                        onChange={e => setBio(e.target.value)} rows={4} />
            </div>

            <div>
              <button
                  className={`btn ${profileSaved ? 'btn--saved' : 'btn--primary'}`}
                  onClick={handleProfileSave}
              >
                {profileSaved
                    ? <><Check size={16} strokeWidth={2.5} /> {t('profile.savedBtn')}</>
                    : <><Save  size={16} strokeWidth={1.8} /> {t('profile.updateBtn')}</>
                }
              </button>
            </div>
          </div>
        </div>

        {/* Change Password card */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-card-icon profile-card-icon--orange">
              <Lock size={18} strokeWidth={1.8} color="var(--orange)" />
            </div>
            <h2 className="profile-card-title">{t('profile.changePassword')}</h2>
          </div>

          <div className="profile-form">
            <div className="form-field">
              <label className="form-label">{t('profile.currentPw')}</label>
              <div className="pw-input-wrap">
                <input className="form-input" type={showCurr ? 'text' : 'password'}
                       value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" />
                <button className="pw-eye" onClick={() => setShowCurr(v => !v)}>
                  {showCurr ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
                </button>
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-field">
                <label className="form-label">{t('profile.newPw')}</label>
                <div className="pw-input-wrap">
                  <input className="form-input" type={showNew ? 'text' : 'password'}
                         value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="••••••••" />
                  <button className="pw-eye" onClick={() => setShowNew(v => !v)}>
                    {showNew ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
                  </button>
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">{t('profile.confirmPw')}</label>
                <div className="pw-input-wrap">
                  <input className="form-input" type={showConf ? 'text' : 'password'}
                         value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••" />
                  <button className="pw-eye" onClick={() => setShowConf(v => !v)}>
                    {showConf ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
                  </button>
                </div>
              </div>
            </div>

            {pwError && <div className="pw-error">{pwError}</div>}

            {pwSaved && (
                <div className="pw-success">
                  <Check size={15} strokeWidth={2.5} /> {t('profile.pwSuccess')}
                </div>
            )}

            <div>
              <button className="btn btn--primary" onClick={handlePasswordChange}>
                <Lock size={15} strokeWidth={1.8} /> {t('profile.changePwBtn')}
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}
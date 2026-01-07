import { useSignIn } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';

type OAuthProvider = 'oauth_github' | 'oauth_gitlab' | 'oauth_huggingface';

export function LoginModal() {
  const { t } = useTranslation();
  const { signIn } = useSignIn();

  const handleLogin = async (strategy: OAuthProvider) => {
    if (!signIn) return;

    await signIn.authenticateWithRedirect({
      strategy,
      redirectUrl: window.location.origin + '/sso-callback',
      redirectUrlComplete: window.location.origin,
    });
  };

  return (
    <div className="login-modal-overlay">
      <div className="login-modal-content">
        <h2 className="login-title">{t('auth.loginTitle', 'Entre para jogar')}</h2>
        <p className="login-subtitle">{t('auth.loginSubtitle', 'Escolha seu provedor')}</p>

        <div className="login-buttons">
          {/* GitHub */}
          <button className="login-btn github-btn" onClick={() => handleLogin('oauth_github')}>
            <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            GitHub
          </button>

          {/* GitLab */}
          <button className="login-btn gitlab-btn" onClick={() => handleLogin('oauth_gitlab')}>
            <svg height="20" width="20" viewBox="0 0 380 380" fill="currentColor">
              <path d="M282.83,170.73l-.27-.69-26.14-68.22a6.81,6.81,0,0,0-2.69-3.24,7,7,0,0,0-8,.43,7,7,0,0,0-2.32,3.52l-17.65,54H154.29l-17.65-54A6.86,6.86,0,0,0,134.32,99a7,7,0,0,0-8-.43,6.87,6.87,0,0,0-2.69,3.24L97.44,170l-.26.69a48.54,48.54,0,0,0,16.1,56.1l.09.07.24.17,39.82,29.82,19.7,14.91,12,9.06a8.07,8.07,0,0,0,9.76,0l12-9.06,19.7-14.91,40.06-30,.1-.08A48.56,48.56,0,0,0,282.83,170.73Z"/>
            </svg>
            GitLab
          </button>

          {/* HuggingFace */}
          <button className="login-btn huggingface-btn" onClick={() => handleLogin('oauth_huggingface')}>
            <span style={{ fontSize: '20px' }}>🤗</span>
            HuggingFace
          </button>
        </div>

        <p className="login-note">{t('auth.loginNote', 'Seus stats serão baseados na sua atividade')}</p>
      </div>
    </div>
  );
}

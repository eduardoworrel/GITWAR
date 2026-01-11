import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth, useUser } from '@clerk/clerk-react';
import './UserProfileModal.css';

type Provider = 'github' | 'gitlab' | 'huggingface';

interface LinkedAccount {
  provider: Provider;
  username: string;
  avatarUrl?: string;
}

interface ProviderData {
  username: string;
  userId: number;
  avatarUrl: string;
  provider: string;
  createdAt: string;
  followers: number;
  following: number;
  totalProjects: number;
  stars: number;
  forks: number;
  contributedProjects: number;
  avgStars: number;
  commits: number;
  commits30d: number;
  commits7d: number;
  commitsExternal: number;
  mergeRequestsTotal: number;
  mergeRequestsMerged: number;
  mergeRequests30d: number;
  issuesTotal: number;
  issuesClosed: number;
  issues30d: number;
  reviews: number;
  organizations: number;
  languages: number;
  mainLanguage: string;
  languageStats: Record<string, number>;
  // GitHub specific (mapped from GitHubData)
  publicRepos?: number;
  prsTotal?: number;
  prsMerged?: number;
  orgs?: number;
  languageRepoCount?: Record<string, number>;
  externalRepos?: number;
  // HuggingFace specific
  models?: number;
  datasets?: number;
  spaces?: number;
  downloads?: number;
  likes?: number;
}

interface UserProfileModalProps {
  username: string;
  onClose: () => void;
}

const PROVIDER_ICONS: Record<Provider, string> = {
  github: '🐙',
  gitlab: '🦊',
  huggingface: '🤗',
};

const PROVIDER_NAMES: Record<Provider, string> = {
  github: 'GitHub',
  gitlab: 'GitLab',
  huggingface: 'HuggingFace',
};

const ALL_PROVIDERS: Provider[] = ['github', 'gitlab', 'huggingface'];

type OAuthStrategy = 'oauth_github' | 'oauth_gitlab' | 'oauth_huggingface';

const PROVIDER_TO_STRATEGY: Record<Provider, OAuthStrategy> = {
  github: 'oauth_github',
  gitlab: 'oauth_gitlab',
  huggingface: 'oauth_huggingface',
};

export function UserProfileModal({ username, onClose }: UserProfileModalProps) {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const { user } = useUser();
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [activeProvider, setActiveProvider] = useState<Provider>('github');
  const [data, setData] = useState<ProviderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch linked accounts
  useEffect(() => {
    const fetchLinkedAccounts = async () => {
      try {
        setLoadingAccounts(true);
        const token = await getToken();
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/api/profile/linked-accounts`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const accounts = await response.json();
          // Map provider number to string
          const mapped = accounts.map((acc: { provider: number; username: string; avatarUrl?: string }) => ({
            provider: acc.provider === 0 ? 'github' : acc.provider === 1 ? 'gitlab' : 'huggingface',
            username: acc.username,
            avatarUrl: acc.avatarUrl,
          }));
          setLinkedAccounts(mapped);
          // Set active to first linked account
          if (mapped.length > 0) {
            setActiveProvider(mapped[0].provider);
          }
        }
      } catch (err) {
        console.error('Failed to fetch linked accounts:', err);
        // Fallback to showing GitHub tab with provided username
        setLinkedAccounts([{ provider: 'github', username }]);
      } finally {
        setLoadingAccounts(false);
      }
    };

    fetchLinkedAccounts();
  }, [getToken, username]);

  // Fetch provider data when active provider changes
  useEffect(() => {
    const fetchProviderData = async () => {
      const account = linkedAccounts.find(a => a.provider === activeProvider);
      if (!account) {
        setData(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/api/${activeProvider}/${account.username}/raw`);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${activeProvider} data`);
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    if (!loadingAccounts && linkedAccounts.length > 0) {
      fetchProviderData();
    }
  }, [activeProvider, linkedAccounts, loadingAccounts]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getTopLanguages = () => {
    const langs = data?.languageStats || data?.languageRepoCount || {};
    return Object.entries(langs)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
  };

  const isLinked = (provider: Provider) => {
    return linkedAccounts.some(a => a.provider === provider);
  };

  const handleLinkAccount = async (provider: Provider) => {
    if (!user) return;

    try {
      const strategy = PROVIDER_TO_STRATEGY[provider];
      const externalAccount = await user.createExternalAccount({
        strategy,
        redirectUrl: window.location.origin + '/sso-callback',
      });

      // Redirect to OAuth provider
      const verificationUrl = externalAccount.verification?.externalVerificationRedirectURL;
      if (verificationUrl) {
        window.location.href = verificationUrl.toString();
      }
    } catch (err) {
      console.error('Failed to link account:', err);
    }
  };

  // Get stats based on provider
  const getRepos = () => data?.totalProjects || data?.publicRepos || 0;
  const getStars = () => data?.stars || data?.likes || 0;
  const getPRs = () => data?.mergeRequestsTotal || data?.prsTotal || 0;
  const getMergedPRs = () => data?.mergeRequestsMerged || data?.prsMerged || 0;
  const getOrgs = () => data?.organizations || data?.orgs || 0;

  return (
    <div className="user-profile-backdrop" onClick={handleBackdropClick}>
      <div className="user-profile-modal">
        <button className="user-profile-close" onClick={onClose}>
          x
        </button>

        {/* Provider Tabs */}
        <div className="user-profile-tabs">
          {ALL_PROVIDERS.map(provider => {
            const linked = isLinked(provider);
            return (
              <button
                key={provider}
                className={`user-profile-tab ${activeProvider === provider ? 'active' : ''} ${!linked ? 'unlinked' : ''}`}
                onClick={() => linked ? setActiveProvider(provider) : handleLinkAccount(provider)}
                title={linked ? PROVIDER_NAMES[provider] : t('profile.linkAccount')}
              >
                <span className="tab-icon">{PROVIDER_ICONS[provider]}</span>
                <span className="tab-name">{PROVIDER_NAMES[provider]}</span>
                {!linked && <span className="tab-link-icon">+</span>}
              </button>
            );
          })}
        </div>

        {(loading || loadingAccounts) && (
          <div className="user-profile-loading">
            {t('messages.loading')}
          </div>
        )}

        {error && (
          <div className="user-profile-error">
            {error}
          </div>
        )}

        {!loading && !loadingAccounts && !isLinked(activeProvider) && (
          <div className="user-profile-unlinked">
            <p>{t('profile.notLinked', { provider: PROVIDER_NAMES[activeProvider] })}</p>
            <button
              className="user-profile-link-btn"
              onClick={() => handleLinkAccount(activeProvider)}
            >
              {t('profile.linkAccount')} {PROVIDER_ICONS[activeProvider]}
            </button>
          </div>
        )}

        {!loading && !loadingAccounts && data && (
          <>
            <div className="user-profile-header">
              <img
                src={data.avatarUrl}
                alt={data.username}
                className="user-profile-avatar"
              />
              <div className="user-profile-info">
                <h2 className="user-profile-username">{data.username}</h2>
                <p className="user-profile-since">
                  {t('profile.memberSince')}: {formatDate(data.createdAt)}
                </p>
                <p className="user-profile-language">
                  {activeProvider === 'huggingface'
                    ? t('profile.aiSpecialist')
                    : `${t('profile.mainLanguage')}: ${data.mainLanguage || 'Unknown'}`
                  }
                </p>
              </div>
            </div>

            <div className="user-profile-stats-grid">
              {/* Social */}
              <div className="user-profile-section">
                <h3>{t('profile.social')}</h3>
                <div className="user-profile-stat-row">
                  <span>{t('profile.followers')}</span>
                  <span className="user-profile-stat-value">{data.followers || 0}</span>
                </div>
                <div className="user-profile-stat-row">
                  <span>{t('profile.following')}</span>
                  <span className="user-profile-stat-value">{data.following || 0}</span>
                </div>
                <div className="user-profile-stat-row">
                  <span>{t('profile.organizations')}</span>
                  <span className="user-profile-stat-value">{getOrgs()}</span>
                </div>
              </div>

              {/* Repositories/Projects */}
              <div className="user-profile-section">
                <h3>{activeProvider === 'huggingface' ? t('profile.projects') : t('profile.repositories')}</h3>
                <div className="user-profile-stat-row">
                  <span>{activeProvider === 'huggingface' ? t('profile.totalProjects') : t('profile.publicRepos')}</span>
                  <span className="user-profile-stat-value">{getRepos()}</span>
                </div>
                {activeProvider === 'huggingface' ? (
                  <>
                    <div className="user-profile-stat-row">
                      <span>{t('profile.models')}</span>
                      <span className="user-profile-stat-value">{data.models || 0}</span>
                    </div>
                    <div className="user-profile-stat-row">
                      <span>{t('profile.datasets')}</span>
                      <span className="user-profile-stat-value">{data.datasets || 0}</span>
                    </div>
                    <div className="user-profile-stat-row">
                      <span>{t('profile.spaces')}</span>
                      <span className="user-profile-stat-value">{data.spaces || 0}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="user-profile-stat-row">
                      <span>{t('profile.totalStars')}</span>
                      <span className="user-profile-stat-value">{getStars()}</span>
                    </div>
                    <div className="user-profile-stat-row">
                      <span>{t('profile.totalForks')}</span>
                      <span className="user-profile-stat-value">{data.forks || 0}</span>
                    </div>
                    <div className="user-profile-stat-row">
                      <span>{t('profile.contributions')}</span>
                      <span className="user-profile-stat-value">{data.contributedProjects || data.externalRepos || 0}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Commits/Activity */}
              <div className="user-profile-section">
                <h3>{activeProvider === 'huggingface' ? t('profile.engagement') : t('profile.commits')}</h3>
                {activeProvider === 'huggingface' ? (
                  <>
                    <div className="user-profile-stat-row">
                      <span>{t('profile.downloads')}</span>
                      <span className="user-profile-stat-value">{data.downloads || 0}</span>
                    </div>
                    <div className="user-profile-stat-row">
                      <span>{t('profile.likes')}</span>
                      <span className="user-profile-stat-value">{data.likes || 0}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="user-profile-stat-row">
                      <span>{t('profile.totalCommits')}</span>
                      <span className="user-profile-stat-value">{data.commits || 0}</span>
                    </div>
                    <div className="user-profile-stat-row">
                      <span>{t('profile.last30Days')}</span>
                      <span className="user-profile-stat-value">{data.commits30d || 0}</span>
                    </div>
                    <div className="user-profile-stat-row">
                      <span>{t('profile.last7Days')}</span>
                      <span className="user-profile-stat-value">{data.commits7d || 0}</span>
                    </div>
                  </>
                )}
              </div>

              {/* PRs & Issues (not for HuggingFace) */}
              {activeProvider !== 'huggingface' && (
                <div className="user-profile-section">
                  <h3>{activeProvider === 'gitlab' ? t('profile.mrsAndIssues') : t('profile.prsAndIssues')}</h3>
                  <div className="user-profile-stat-row">
                    <span>{activeProvider === 'gitlab' ? t('profile.totalMRs') : t('profile.totalPRs')}</span>
                    <span className="user-profile-stat-value">{getPRs()}</span>
                  </div>
                  <div className="user-profile-stat-row">
                    <span>{activeProvider === 'gitlab' ? t('profile.mergedMRs') : t('profile.mergedPRs')}</span>
                    <span className="user-profile-stat-value">{getMergedPRs()}</span>
                  </div>
                  <div className="user-profile-stat-row">
                    <span>{t('profile.totalIssues')}</span>
                    <span className="user-profile-stat-value">{data.issuesTotal || 0}</span>
                  </div>
                  <div className="user-profile-stat-row">
                    <span>{t('profile.closedIssues')}</span>
                    <span className="user-profile-stat-value">{data.issuesClosed || 0}</span>
                  </div>
                  <div className="user-profile-stat-row">
                    <span>{t('profile.reviews')}</span>
                    <span className="user-profile-stat-value">{data.reviews || 0}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Top Languages (not for HuggingFace) */}
            {activeProvider !== 'huggingface' && getTopLanguages().length > 0 && (
              <div className="user-profile-languages">
                <h3>{t('profile.topLanguages')}</h3>
                <div className="user-profile-language-bars">
                  {getTopLanguages().map(([lang, count]) => (
                    <div key={lang} className="user-profile-language-item">
                      <span className="user-profile-language-name">{lang}</span>
                      <div className="user-profile-language-bar-container">
                        <div
                          className="user-profile-language-bar"
                          style={{
                            width: `${Math.min(100, (count / (getRepos() || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="user-profile-language-count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

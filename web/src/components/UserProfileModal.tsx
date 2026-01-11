import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth, useUser } from '@clerk/clerk-react';
import './UserProfileModal.css';

type Provider = 'github' | 'gitlab' | 'huggingface';

// localStorage cache keys
const CACHE_KEYS = {
  linkedAccounts: 'userProfile_linkedAccounts',
  providerData: (provider: Provider) => `userProfile_data_${provider}`,
  activeProvider: 'userProfile_activeProvider',
};

// Cache TTL: 5 minutes for background refresh (can be used in the future)
// const CACHE_TTL = 5 * 60 * 1000;

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

// Cache helper functions
interface CachedData<T> {
  data: T;
  timestamp: number;
}

function getFromCache<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const parsed: CachedData<T> = JSON.parse(cached);
    return parsed.data;
  } catch {
    return null;
  }
}

function setToCache<T>(key: string, data: T): void {
  try {
    const cached: CachedData<T> = { data, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(cached));
  } catch {
    // localStorage might be full or unavailable
  }
}

// isCacheStale can be used in the future to only refresh if cache is old
// function isCacheStale(key: string): boolean {
//   try {
//     const cached = localStorage.getItem(key);
//     if (!cached) return true;
//     const parsed = JSON.parse(cached);
//     return Date.now() - parsed.timestamp > CACHE_TTL;
//   } catch {
//     return true;
//   }
// }

export function UserProfileModal({ username, onClose }: UserProfileModalProps) {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const { user } = useUser();

  // Initialize state from cache
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>(() => {
    return getFromCache<LinkedAccount[]>(CACHE_KEYS.linkedAccounts) || [];
  });

  const [activeProvider, setActiveProviderState] = useState<Provider>(() => {
    const cached = localStorage.getItem(CACHE_KEYS.activeProvider);
    return (cached === 'github' || cached === 'gitlab' || cached === 'huggingface') ? cached : 'github';
  });

  // Cache provider data per provider
  const [providerDataCache, setProviderDataCache] = useState<Record<Provider, ProviderData | null>>(() => ({
    github: getFromCache<ProviderData>(CACHE_KEYS.providerData('github')),
    gitlab: getFromCache<ProviderData>(CACHE_KEYS.providerData('gitlab')),
    huggingface: getFromCache<ProviderData>(CACHE_KEYS.providerData('huggingface')),
  }));

  const data = providerDataCache[activeProvider];

  // Only show loading if we have no cached data
  const cachedAccounts = getFromCache<LinkedAccount[]>(CACHE_KEYS.linkedAccounts);
  const cachedProviderData = getFromCache<ProviderData>(CACHE_KEYS.providerData(activeProvider));
  const [loading, setLoading] = useState(!cachedProviderData);
  const [loadingAccounts, setLoadingAccounts] = useState(!cachedAccounts || cachedAccounts.length === 0);
  const [error, setError] = useState<string | null>(null);

  // Persist active provider to localStorage
  const setActiveProvider = useCallback((provider: Provider) => {
    localStorage.setItem(CACHE_KEYS.activeProvider, provider);
    setActiveProviderState(provider);
  }, []);

  // Fetch linked accounts - use cache first, then refresh in background
  useEffect(() => {
    const cachedData = getFromCache<LinkedAccount[]>(CACHE_KEYS.linkedAccounts);
    const hasCachedData = cachedData && cachedData.length > 0;

    // If we have cached data, use it immediately and don't show loading
    if (hasCachedData) {
      setLinkedAccounts(cachedData);
      setLoadingAccounts(false);
      // Set active provider from cache if not already set
      const cachedProvider = localStorage.getItem(CACHE_KEYS.activeProvider) as Provider | null;
      if (!cachedProvider && cachedData.length > 0) {
        setActiveProvider(cachedData[0].provider);
      }
    }

    const fetchLinkedAccounts = async () => {
      try {
        // Only show loading if we have no cached data
        if (!hasCachedData) {
          setLoadingAccounts(true);
        }
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
          const mapped: LinkedAccount[] = accounts.map((acc: { provider: number; username: string; avatarUrl?: string }) => ({
            provider: acc.provider === 0 ? 'github' : acc.provider === 1 ? 'gitlab' : 'huggingface',
            username: acc.username,
            avatarUrl: acc.avatarUrl,
          }));
          setLinkedAccounts(mapped);
          // Save to cache
          setToCache(CACHE_KEYS.linkedAccounts, mapped);
          // Set active to first linked account only if no cached provider
          const cachedProvider = localStorage.getItem(CACHE_KEYS.activeProvider) as Provider | null;
          if (!cachedProvider && mapped.length > 0) {
            setActiveProvider(mapped[0].provider);
          }
        }
      } catch (err) {
        console.error('Failed to fetch linked accounts:', err);
        // Only fallback if we have no cached data
        if (!hasCachedData) {
          setLinkedAccounts([{ provider: 'github', username }]);
        }
      } finally {
        setLoadingAccounts(false);
      }
    };

    fetchLinkedAccounts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getToken, username]);

  // Fetch provider data when active provider changes - use cache first
  useEffect(() => {
    const account = linkedAccounts.find(a => a.provider === activeProvider);
    if (!account) {
      setLoading(false);
      return;
    }

    const cacheKey = CACHE_KEYS.providerData(activeProvider);
    const cachedData = providerDataCache[activeProvider];
    const hasCachedData = !!cachedData;

    // If we have cached data, show it immediately
    if (hasCachedData) {
      setLoading(false);
    }

    const fetchProviderData = async () => {
      try {
        // Only show loading if we have no cached data
        if (!hasCachedData) {
          setLoading(true);
        }
        setError(null);
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/api/${activeProvider}/${account.username}/raw`);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${activeProvider} data`);
        }
        const result = await response.json();
        // Update cache
        setProviderDataCache(prev => ({ ...prev, [activeProvider]: result }));
        setToCache(cacheKey, result);
      } catch (err) {
        // Only show error if we have no cached data
        if (!hasCachedData) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        setLoading(false);
      }
    };

    if (!loadingAccounts && linkedAccounts.length > 0) {
      fetchProviderData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

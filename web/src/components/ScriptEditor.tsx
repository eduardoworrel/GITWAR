import { useState, useEffect, useRef, useCallback } from 'react';
import Editor, { type Monaco } from '@monaco-editor/react';
import { useAuth } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';

interface ScriptStatus {
  enabled: boolean;
  hasCustomScript: boolean;
  errorCount: number;
  isDisabled: boolean;
  disabledReason: string | null;
}

interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

interface ScriptEditorProps {
  reinoColor: string;
}

// JavaScript API documentation for autocomplete
const SCRIPT_API = {
  variables: [
    { name: 'self', type: 'ScriptEntity', description: 'Your player data' },
    { name: 'enemies', type: 'ScriptEntity[]', description: 'Enemies in vision range' },
    { name: 'allies', type: 'ScriptEntity[]', description: 'Allies in vision range' },
    { name: 'monsters', type: 'ScriptEntity[]', description: 'Monsters in vision range' },
    { name: 'players', type: 'ScriptEntity[]', description: 'Other players in vision range' },
    { name: 'event', type: 'EventInfo', description: 'Current event info' },
    { name: 'tick', type: 'number', description: 'Current server tick' },
    { name: 'attackRange', type: 'number', description: 'Attack range constant' },
  ],
  functions: [
    { name: 'moveTo', params: 'x: number, y: number', description: 'Move to coordinates' },
    { name: 'moveToEntity', params: 'entity: ScriptEntity', description: 'Move towards entity' },
    { name: 'attack', params: 'entity: ScriptEntity', description: 'Attack entity' },
    { name: 'attackNearest', params: '', description: 'Attack nearest enemy' },
    { name: 'flee', params: '', description: 'Run away from enemies' },
    { name: 'stop', params: '', description: 'Stop all actions' },
    { name: 'getDistance', params: 'entity: ScriptEntity', returns: 'number', description: 'Get distance to entity' },
    { name: 'isInAttackRange', params: 'entity: ScriptEntity', returns: 'boolean', description: 'Check if in attack range' },
    { name: 'getNearestEnemy', params: '', returns: 'ScriptEntity | null', description: 'Get nearest enemy' },
    { name: 'getNearestAlly', params: '', returns: 'ScriptEntity | null', description: 'Get nearest ally' },
    { name: 'getNearestMonster', params: '', returns: 'ScriptEntity | null', description: 'Get nearest monster' },
    { name: 'getNearestPlayer', params: '', returns: 'ScriptEntity | null', description: 'Get nearest player' },
    { name: 'getEntitiesInRange', params: 'range: number', returns: 'ScriptEntity[]', description: 'Get entities in range' },
    { name: 'log', params: 'message: string', description: 'Debug log (max 10/tick)' },
    { name: 'random', params: '', returns: 'number', description: 'Random 0-1' },
    { name: 'randomRange', params: 'min: number, max: number', returns: 'number', description: 'Random in range' },
  ],
};

// Type definitions for Monaco
const SCRIPT_TYPE_DEFS = `
interface ScriptEntity {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  level: number;
  elo: number;
  dano: number;
  armadura: number;
  critico: number;
  evasao: number;
  velocidadeAtaque: number;
  velocidadeMovimento: number;
  estado: string;
  reino: string;
  isMonster: boolean;
  isPlayer: boolean;
  isAlly: boolean;
  isEnemy: boolean;
}

interface EventInfo {
  active: boolean;
  type: string;
  monstersRemaining: number;
}

declare const self: ScriptEntity;
declare const enemies: ScriptEntity[];
declare const allies: ScriptEntity[];
declare const monsters: ScriptEntity[];
declare const players: ScriptEntity[];
declare const event: EventInfo;
declare const tick: number;
declare const attackRange: number;

declare function moveTo(x: number, y: number): void;
declare function moveToEntity(entity: ScriptEntity): void;
declare function attack(entity: ScriptEntity): void;
declare function attackNearest(): void;
declare function flee(): void;
declare function stop(): void;
declare function getDistance(entity: ScriptEntity): number;
declare function isInAttackRange(entity: ScriptEntity): boolean;
declare function getNearestEnemy(): ScriptEntity | null;
declare function getNearestAlly(): ScriptEntity | null;
declare function getNearestMonster(): ScriptEntity | null;
declare function getNearestPlayer(): ScriptEntity | null;
declare function getEntitiesInRange(range: number): ScriptEntity[];
declare function log(message: string): void;
declare function random(): number;
declare function randomRange(min: number, max: number): number;

declare function onTick(): void;
`;

export function ScriptEditor({ reinoColor }: ScriptEditorProps) {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const editorRef = useRef<any>(null);

  const [script, setScript] = useState<string>('');
  const [originalScript, setOriginalScript] = useState<string>('');
  const [status, setStatus] = useState<ScriptStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [showDocs, setShowDocs] = useState(() => {
    // Show docs by default on first visit
    const hasSeenDocs = localStorage.getItem('scriptEditor_hasSeenDocs');
    return !hasSeenDocs;
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDefaultScript, setIsDefaultScript] = useState(false);

  // Load script and status on mount
  useEffect(() => {
    const fetchData = async () => {
      const token = await getToken();

      let scriptLoaded = false;

      // Try to fetch user's script if authenticated
      if (token) {
        console.log('[ScriptEditor] Token found, fetching user script...');
        try {
          const scriptRes = await fetch('/api/player/script', {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log('[ScriptEditor] User script response status:', scriptRes.status);
          if (scriptRes.ok) {
            const data = await scriptRes.json();
            console.log('[ScriptEditor] User script loaded, isDefault:', data.isDefault, 'length:', data.script?.length);
            setScript(data.script);
            setOriginalScript(data.script);
            setIsDefaultScript(data.isDefault === true);
            scriptLoaded = true;
          } else {
            console.error('[ScriptEditor] Failed to fetch user script:', scriptRes.status, await scriptRes.text());
          }

          // Fetch status
          const statusRes = await fetch('/api/player/script/status', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (statusRes.ok) {
            const data = await statusRes.json();
            setStatus(data);
          }
        } catch (err) {
          console.error('[ScriptEditor] Failed to load script:', err);
        }
      } else {
        console.log('[ScriptEditor] No token available');
      }

      // If script wasn't loaded, fetch the default as fallback
      if (!scriptLoaded) {
        console.log('[ScriptEditor] Loading default script as fallback...');
        try {
          const defaultRes = await fetch('/api/player/script/default');
          console.log('[ScriptEditor] Default response status:', defaultRes.status);
          if (defaultRes.ok) {
            const data = await defaultRes.json();
            console.log('[ScriptEditor] Default script loaded:', data.script?.substring(0, 100));
            setScript(data.script);
            setOriginalScript(data.script);
            setIsDefaultScript(true);
          } else {
            console.error('[ScriptEditor] Failed to fetch default:', await defaultRes.text());
          }
        } catch (err) {
          console.error('[ScriptEditor] Failed to load default script:', err);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [getToken]);

  // Setup Monaco editor with type definitions
  const handleEditorDidMount = useCallback((editor: any, monaco: Monaco) => {
    editorRef.current = editor;

    // Add type definitions for autocomplete
    monaco.languages.typescript.javascriptDefaults.addExtraLib(
      SCRIPT_TYPE_DEFS,
      'ts:script-api.d.ts'
    );

    // Configure JavaScript compiler options
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      lib: ['ES2020'],
      strict: false,
      noEmit: true,
    });
  }, []);

  // Validate script
  const handleValidate = useCallback(async () => {
    setValidating(true);
    setValidation(null);

    try {
      const res = await fetch('/api/player/script/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script }),
      });
      const data = await res.json();
      setValidation(data);
    } catch (err) {
      setValidation({ isValid: false, error: 'Failed to validate script' });
    } finally {
      setValidating(false);
    }
  }, [script]);

  // Save script
  const handleSave = useCallback(async () => {
    const token = await getToken();
    if (!token) return;

    setSaving(true);
    setValidation(null);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/player/script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ script }),
      });

      if (res.ok) {
        setOriginalScript(script);
        setIsDefaultScript(false); // No longer using default after saving custom script
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);

        // Refresh status
        const statusRes = await fetch('/api/player/script/status', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (statusRes.ok) {
          setStatus(await statusRes.json());
        }
      } else {
        const data = await res.json();
        setValidation({ isValid: false, error: data.error });
      }
    } catch (err) {
      setValidation({ isValid: false, error: 'Failed to save script' });
    } finally {
      setSaving(false);
    }
  }, [script, getToken]);

  // Toggle script enabled
  const handleToggle = useCallback(async () => {
    const token = await getToken();
    if (!token || !status) return;

    try {
      const res = await fetch('/api/player/script/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled: !status.enabled }),
      });

      if (res.ok) {
        setStatus({ ...status, enabled: !status.enabled, isDisabled: false, errorCount: 0 });
      } else {
        const data = await res.json();
        setValidation({ isValid: false, error: data.error });
      }
    } catch (err) {
      console.error('Failed to toggle script:', err);
    }
  }, [status, getToken]);

  // Reset to default
  const handleReset = useCallback(async () => {
    const token = await getToken();
    if (!token) return;

    if (!confirm(t('script.confirmReset', 'Are you sure you want to reset to the default script?'))) {
      return;
    }

    try {
      // Get default script
      const defaultRes = await fetch('/api/player/script/default');
      if (defaultRes.ok) {
        const data = await defaultRes.json();
        setScript(data.script);
      }

      // Reset on server
      const res = await fetch('/api/player/script/reset', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setIsDefaultScript(true);
        setOriginalScript(script);
        // Refresh status
        const statusRes = await fetch('/api/player/script/status', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (statusRes.ok) {
          setStatus(await statusRes.json());
        }
      }
    } catch (err) {
      console.error('Failed to reset script:', err);
    }
  }, [getToken, t, script]);

  const hasUnsavedChanges = script !== originalScript;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ color: 'rgba(255,255,255,0.6)' }}>{t('loading', 'Loading...')}</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
      {/* Header with status and controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Enable/Disable toggle */}
          <button
            onClick={handleToggle}
            disabled={status?.isDisabled}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: status?.enabled ? reinoColor : 'rgba(255,255,255,0.1)',
              color: status?.enabled ? 'white' : 'rgba(255,255,255,0.6)',
              cursor: status?.isDisabled ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            {status?.enabled ? t('script.enabled', 'Enabled') : t('script.disabled', 'Disabled')}
          </button>

          {/* Status info */}
          {status?.isDisabled && (
            <span style={{ color: '#ff6b6b', fontSize: '11px' }}>
              {status.disabledReason}
            </span>
          )}
          {status && status.errorCount > 0 && !status.isDisabled && (
            <span style={{ color: '#ffa94d', fontSize: '11px' }}>
              {t('script.errors', 'Errors')}: {status.errorCount}/10
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Default script indicator */}
          {isDefaultScript && (
            <span style={{
              padding: '4px 8px',
              borderRadius: '4px',
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              color: '#60a5fa',
              fontSize: '10px',
            }}>
              {t('script.defaultTemplate', 'Default Template')}
            </span>
          )}

          {/* Docs toggle */}
          <button
            onClick={() => {
              if (showDocs) {
                // Save that user has seen docs when closing
                localStorage.setItem('scriptEditor_hasSeenDocs', 'true');
              }
              setShowDocs(!showDocs);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: showDocs ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            {t('script.docs', 'API Docs')}
          </button>

          {/* Validate button */}
          <button
            onClick={handleValidate}
            disabled={validating}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.7)',
              cursor: validating ? 'not-allowed' : 'pointer',
              fontSize: '11px',
            }}
          >
            {validating ? '...' : t('script.validate', 'Validate')}
          </button>

          {/* Reset button */}
          <button
            onClick={handleReset}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            {t('script.reset', 'Reset')}
          </button>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
            style={{
              padding: '6px 16px',
              borderRadius: '6px',
              border: 'none',
              background: hasUnsavedChanges ? reinoColor : 'rgba(255,255,255,0.1)',
              color: hasUnsavedChanges ? 'white' : 'rgba(255,255,255,0.4)',
              cursor: saving || !hasUnsavedChanges ? 'not-allowed' : 'pointer',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            {saving ? '...' : saveSuccess ? t('script.saved', 'Saved!') : t('script.save', 'Save')}
          </button>
        </div>
      </div>

      {/* Validation feedback */}
      {validation && (
        <div style={{
          padding: '8px 12px',
          borderRadius: '6px',
          background: validation.isValid ? 'rgba(64,192,87,0.2)' : 'rgba(255,107,107,0.2)',
          border: `1px solid ${validation.isValid ? 'rgba(64,192,87,0.5)' : 'rgba(255,107,107,0.5)'}`,
          fontSize: '11px',
          color: validation.isValid ? '#40c057' : '#ff6b6b',
        }}>
          {validation.isValid
            ? t('script.valid', 'Script is valid!')
            : validation.error}
        </div>
      )}

      {/* Main content area */}
      <div style={{ display: 'flex', flex: 1, gap: '12px', minHeight: 0 }}>
        {/* API Documentation panel */}
        {showDocs && (
          <div style={{
            width: '280px',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            padding: '12px',
            overflow: 'auto',
            fontSize: '11px',
          }}>
            <h4 style={{ margin: '0 0 12px 0', color: reinoColor }}>{t('script.variables', 'Variables')}</h4>
            {SCRIPT_API.variables.map((v) => (
              <div key={v.name} style={{ marginBottom: '8px' }}>
                <code style={{ color: '#9cdcfe' }}>{v.name}</code>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}> : {v.type}</span>
                <div style={{ color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{v.description}</div>
              </div>
            ))}

            <h4 style={{ margin: '16px 0 12px 0', color: reinoColor }}>{t('script.functions', 'Functions')}</h4>
            {SCRIPT_API.functions.map((f) => (
              <div key={f.name} style={{ marginBottom: '8px' }}>
                <code style={{ color: '#dcdcaa' }}>{f.name}</code>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>({f.params})</span>
                {f.returns && <span style={{ color: 'rgba(255,255,255,0.4)' }}> : {f.returns}</span>}
                <div style={{ color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{f.description}</div>
              </div>
            ))}
          </div>
        )}

        {/* Monaco Editor */}
        <div style={{
          flex: 1,
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <Editor
            height="100%"
            defaultLanguage="javascript"
            value={script}
            onChange={(value) => setScript(value || '')}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              folding: true,
              bracketPairColorization: { enabled: true },
              suggestOnTriggerCharacters: true,
              quickSuggestions: true,
              padding: { top: 8 },
            }}
          />
        </div>
      </div>

      {/* Unsaved changes indicator */}
      {hasUnsavedChanges && (
        <div style={{
          textAlign: 'center',
          color: '#ffa94d',
          fontSize: '11px',
        }}>
          {t('script.unsavedChanges', 'You have unsaved changes')}
        </div>
      )}
    </div>
  );
}

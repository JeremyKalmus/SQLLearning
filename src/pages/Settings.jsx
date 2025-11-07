import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function Settings() {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    loadApiKeyStatus();
  }, [user]);

  const loadApiKeyStatus = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_api_keys')
      .select('encrypted_api_key, is_valid, last_validated')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setHasApiKey(true);
      setApiKey('');
    }
  };

  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (!apiKey.trim()) {
      setMessage({ type: 'error', text: 'Please enter an API key' });
      setLoading(false);
      return;
    }

    if (!apiKey.startsWith('sk-ant-')) {
      setMessage({ type: 'error', text: 'Invalid Anthropic API key format' });
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('user_api_keys')
      .upsert({
        user_id: user.id,
        encrypted_api_key: apiKey,
        is_valid: true,
        last_validated: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      setMessage({ type: 'error', text: `Failed to save API key: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: 'API key saved successfully!' });
      setHasApiKey(true);
      setApiKey('');
      setShowKey(false);
    }

    setLoading(false);
  };

  const handleRemoveApiKey = async () => {
    if (!confirm('Are you sure you want to remove your API key?')) return;

    setLoading(true);
    const { error } = await supabase
      .from('user_api_keys')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      setMessage({ type: 'error', text: `Failed to remove API key: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: 'API key removed successfully' });
      setHasApiKey(false);
      setApiKey('');
    }

    setLoading(false);
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1>Settings</h1>

        <div className="settings-section">
          <h2>Anthropic API Key</h2>
          <p className="section-description">
            Your API key is required to use AI-powered features like problem generation,
            answer checking, and hints. Your key is stored securely and only accessible to you.
          </p>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="api-key-status">
            {hasApiKey ? (
              <div className="status-badge status-success">
                ✓ API Key Configured
              </div>
            ) : (
              <div className="status-badge status-warning">
                ⚠ No API Key Set
              </div>
            )}
          </div>

          <form onSubmit={handleSaveApiKey} className="api-key-form">
            <div className="form-group">
              <label htmlFor="apiKey">
                {hasApiKey ? 'Update API Key' : 'Enter API Key'}
              </label>
              <input
                id="apiKey"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-..."
                disabled={loading}
              />
              <button
                type="button"
                className="btn-secondary btn-small"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>

            <div className="button-group">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : hasApiKey ? 'Update Key' : 'Save Key'}
              </button>
              {hasApiKey && (
                <button
                  type="button"
                  className="btn-danger"
                  onClick={handleRemoveApiKey}
                  disabled={loading}
                >
                  Remove Key
                </button>
              )}
            </div>
          </form>

          <div className="help-section">
            <h3>How to get an API key</h3>
            <ol>
              <li>
                Go to{' '}
                <a
                  href="https://console.anthropic.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  console.anthropic.com
                </a>
              </li>
              <li>Sign up or log in to your account</li>
              <li>Navigate to API Keys section</li>
              <li>Create a new API key</li>
              <li>Copy and paste it above</li>
            </ol>
            <p className="note">
              Note: API usage will be billed to your Anthropic account. Check their pricing
              for current rates.
            </p>
          </div>
        </div>

        <div className="settings-section">
          <h2>Account Information</h2>
          <div className="info-row">
            <span className="info-label">Email:</span>
            <span className="info-value">{user?.email}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

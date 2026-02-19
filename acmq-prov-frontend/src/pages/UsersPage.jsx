import React, { useState, useEffect } from 'react';
import api from '../services/api';
import NewUserModal from '../components/NewUserModal';
import './UsersPage.css';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showNewUserModal, setShowNewUserModal] = useState(false);

  // Load users list on mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Load selected user details when selection changes
  useEffect(() => {
    if (selectedUserId) {
      loadUserDetails(selectedUserId);
    } else {
      setSelectedUser(null);
    }
  }, [selectedUserId]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      setError('Kunde inte hämta användarlistan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUserDetails = async (userId) => {
    try {
      setUserLoading(true);
      setError(null);
      const data = await api.getUserById(userId);
      setSelectedUser(data);
    } catch (err) {
      setError('Kunde inte hämta användardetaljer: ' + err.message);
    } finally {
      setUserLoading(false);
    }
  };

  const handleUserOrderSuccess = () => {
    setShowNewUserModal(false);
    // Optionally reload users
    loadUsers();
  };

  const renderRoleSection = (title, items, badgeClass, roleType) => {
    if (!items || items.length === 0) {
      return (
        <div className="role-section">
          <h4>{title}</h4>
          <p className="no-items">Inga {title.toLowerCase()}</p>
        </div>
      );
    }

    return (
      <div className="role-section">
        <h4>{title}</h4>
        <div className="role-items">
          {items.map((item, index) => (
            <div key={index} className="role-item">
              <span className={`badge ${item.type === 'queue' ? 'badge-queue' : 'badge-topic'}`}>
                {item.type}
              </span>
              <span className="role-item-name">{item.name}</span>
              <span className="badge badge-env">{item.environment}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSubscriptionSection = (title, items) => {
    if (!items || items.length === 0) {
      return (
        <div className="role-section">
          <h4>{title}</h4>
          <p className="no-items">Inga subscriptions</p>
        </div>
      );
    }

    return (
      <div className="role-section">
        <h4>{title}</h4>
        <div className="role-items">
          {items.map((item, index) => (
            <div key={index} className="subscription-item">
              <div className="subscription-item-topic">
                <span className="badge badge-topic">topic</span>
                <span className="role-item-name">{item.name}</span>
                <span className="badge badge-env">{item.environment}</span>
              </div>
              <div className="subscription-item-sub">
                <span className="subscriber-arrow">→</span>
                <span className="subscriber-label">Subscription:</span>
                <span className="subscription-name-text">{item.subscription}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">Artemis-användare</h2>
        <button className="btn btn-primary" onClick={() => setShowNewUserModal(true)}>
          + Beställ ny användare
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="form-group">
          <label className="form-label">Välj användare</label>
          <select
            className="form-control form-select"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            <option value="">-- Välj en användare --</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {userLoading && (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      )}

      {selectedUser && !userLoading && (
        <div className="user-details">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">{selectedUser.name}</h3>
              <span className="badge badge-env">{selectedUser.team}</span>
            </div>

            {selectedUser.description && (
              <p className="user-description">{selectedUser.description}</p>
            )}

            <div className="user-meta">
              <span>Skapad: {selectedUser.createdAt}</span>
            </div>
          </div>

          <div className="roles-grid">
            <div className="card">
              {renderRoleSection(
                'Producent på',
                selectedUser.roles?.producer,
                'badge-producer',
                'producer'
              )}
            </div>

            <div className="card">
              {renderRoleSection(
                'Konsument på',
                selectedUser.roles?.consumer,
                'badge-consumer',
                'consumer'
              )}
            </div>

            <div className="card">
              {renderSubscriptionSection(
                'Subscriber på',
                selectedUser.roles?.subscription
              )}
            </div>
          </div>
        </div>
      )}

      {!selectedUser && !selectedUserId && !userLoading && (
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <p>Välj en användare från listan för att se dess roller och behörigheter</p>
        </div>
      )}

      {showNewUserModal && (
        <NewUserModal
          onClose={() => setShowNewUserModal(false)}
          onSuccess={handleUserOrderSuccess}
        />
      )}
    </div>
  );
};

export default UsersPage;

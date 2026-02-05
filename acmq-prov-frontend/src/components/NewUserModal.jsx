import React, { useState } from 'react';
import api from '../services/api';
import './Modal.css';

const NewUserModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    userName: '',
    description: '',
    team: '',
    requester: '',
    environment: 'dev'
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.userName.trim()) {
      newErrors.userName = 'Användarnamn är obligatoriskt';
    } else if (!/^[a-zA-Z0-9._-]+$/.test(formData.userName)) {
      newErrors.userName = 'Endast bokstäver, siffror, punkt, underscore och bindestreck';
    }

    if (!formData.team.trim()) {
      newErrors.team = 'Team är obligatoriskt';
    }

    if (!formData.requester.trim()) {
      newErrors.requester = 'Beställare är obligatoriskt';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setSubmitting(true);
    setSubmitResult(null);

    try {
      const result = await api.createUserOrder({
        requestType: 'new',
        resourceType: 'user',
        name: formData.userName,
        description: formData.description,
        team: formData.team,
        requester: formData.requester,
        environment: formData.environment
      });

      if (result.ok) {
        setSubmitResult({
          type: 'success',
          message: `Användarbeställning skapad! Request ID: ${result.requestId}`,
          requestId: result.requestId
        });
        setTimeout(() => {
          onSuccess && onSuccess(result);
        }, 2000);
      } else {
        setSubmitResult({
          type: 'error',
          message: result.message || 'Ett fel uppstod'
        });
      }
    } catch (error) {
      setSubmitResult({
        type: 'error',
        message: 'Kunde inte skapa beställning: ' + error.message
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Beställ ny Artemis-användare</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {submitResult && (
              <div className={`alert alert-${submitResult.type}`}>
                {submitResult.message}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Användarnamn *</label>
              <input
                type="text"
                name="userName"
                className={`form-control ${errors.userName ? 'error' : ''}`}
                value={formData.userName}
                onChange={handleChange}
                placeholder="t.ex. my-service eller my-app"
              />
              {errors.userName && <span className="error-text">{errors.userName}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Beskrivning</label>
              <textarea
                name="description"
                className="form-control"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Vad ska användaren användas till?"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Team *</label>
                <input
                  type="text"
                  name="team"
                  className={`form-control ${errors.team ? 'error' : ''}`}
                  value={formData.team}
                  onChange={handleChange}
                  placeholder="t.ex. Team Phoenix"
                />
                {errors.team && <span className="error-text">{errors.team}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Miljö *</label>
                <select
                  name="environment"
                  className="form-control form-select"
                  value={formData.environment}
                  onChange={handleChange}
                >
                  <option value="dev">Development</option>
                  <option value="test">Test</option>
                  <option value="stage">Stage</option>
                  <option value="prod">Production</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Beställare *</label>
              <input
                type="text"
                name="requester"
                className={`form-control ${errors.requester ? 'error' : ''}`}
                value={formData.requester}
                onChange={handleChange}
                placeholder="Ditt namn eller e-post"
              />
              {errors.requester && <span className="error-text">{errors.requester}</span>}
            </div>

            <div className="info-box">
              <strong>Information:</strong> Efter att beställningen skickats skapas en
              Pull Request i konfigurationsrepot. Användaren blir tillgänglig efter
              att PR:en har godkänts och mergats.
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Avbryt
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Skickar...' : 'Skicka beställning'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewUserModal;

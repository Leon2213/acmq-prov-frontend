import React, { useState } from 'react';
import './QueueTopicForm.css';

const QueueTopicForm = () => {
  const [formData, setFormData] = useState({
    requestType: 'new', // new, update
    resourceType: 'queue', // queue, topic
    name: '',
    environment: 'dev',
    consumers: [''],
    producers: [''],
    description: '',
    team: '',
    requester: '',
    ticketNumer: ''
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Rensa fel när användaren ändrar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleArrayChange = (index, value, field) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData(prev => ({
      ...prev,
      [field]: newArray
    }));
  };

  const addArrayField = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayField = (index, field) => {
    if (formData[field].length > 1) {
      const newArray = formData[field].filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        [field]: newArray
      }));
    }
  };

    const validate = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Namn på kö/topic är obligatoriskt';
        } else if (!/^[a-zA-Z0-9._-]+$/.test(formData.name)) {
            newErrors.name = 'Endast bokstäver, siffror, punkt, underscore och bindestreck tillåtna';
        }

        if (!formData.team.trim()) {
            newErrors.team = 'Team är obligatoriskt';
        }

        if (!formData.requester.trim()) {
            newErrors.requester = 'Beställare är obligatoriskt';
        }

        if (!formData.ticketNumber.trim()) {
            newErrors.ticketNumber = 'Ärendenummer är obligatoriskt';
        } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.ticketNumber)) {
            newErrors.ticketNumber = 'Endast bokstäver, siffror, underscore och bindestreck tillåtna';
        }

        const validConsumers = formData.consumers.filter(c => c.trim());
        const validProducers = formData.producers.filter(p => p.trim());

        if (validConsumers.length === 0 && validProducers.length === 0) {
            newErrors.general = 'Minst en konsument eller producent måste anges';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    setSubmitStatus(null);

    try {
      const payload = {
        ...formData,
        consumers: formData.consumers.filter(c => c.trim()),
        producers: formData.producers.filter(p => p.trim())
      };

      const response = await fetch('/api/mq/provision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitStatus({
          type: 'success',
          message: `Beställning skapad! PR-länkar: ${result.pullRequests.join(', ')}`,
          requestId: result.requestId
        });
        // Återställ formuläret
        setFormData({
          requestType: 'new',
          resourceType: 'queue',
          name: '',
          environment: 'dev',
          consumers: [''],
          producers: [''],
          description: '',
          team: '',
          requester: ''
        });
      } else {
        setSubmitStatus({
          type: 'error',
          message: result.message || 'Ett fel uppstod vid skapande av beställning'
        });
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'Kunde inte kontakta servern: ' + error.message
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="queue-topic-form-container">
      <h1>Beställ MQ Queue/Topic</h1>
      
      {submitStatus && (
        <div className={`alert alert-${submitStatus.type}`}>
          {submitStatus.message}
          {submitStatus.requestId && (
            <div className="request-id">Request ID: {submitStatus.requestId}</div>
          )}
        </div>
      )}

      {errors.general && (
        <div className="alert alert-error">{errors.general}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Typ av beställning *</label>
            <select 
              name="requestType" 
              value={formData.requestType} 
              onChange={handleChange}
            >
              <option value="new">Ny kö/topic</option>
              <option value="update">Uppdatera befintlig</option>
            </select>
          </div>

          <div className="form-group">
            <label>Resurstyp *</label>
            <select 
              name="resourceType" 
              value={formData.resourceType} 
              onChange={handleChange}
            >
              <option value="queue">Queue</option>
              <option value="topic">Topic</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Namn på {formData.resourceType} *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="t.ex. order.processing.queue"
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label>Miljö *</label>
            <select 
              name="environment" 
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
          <label>Konsumenter</label>
          {formData.consumers.map((consumer, index) => (
            <div key={index} className="array-input">
              <input
                type="text"
                value={consumer}
                onChange={(e) => handleArrayChange(index, e.target.value, 'consumers')}
                placeholder="Användarnamn eller service-namn"
              />
              {formData.consumers.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => removeArrayField(index, 'consumers')}
                  className="btn-remove"
                >
                  Ta bort
                </button>
              )}
            </div>
          ))}
          <button 
            type="button" 
            onClick={() => addArrayField('consumers')}
            className="btn-add"
          >
            + Lägg till konsument
          </button>
        </div>

        <div className="form-group">
          <label>Producenter</label>
          {formData.producers.map((producer, index) => (
            <div key={index} className="array-input">
              <input
                type="text"
                value={producer}
                onChange={(e) => handleArrayChange(index, e.target.value, 'producers')}
                placeholder="Användarnamn eller service-namn"
              />
              {formData.producers.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => removeArrayField(index, 'producers')}
                  className="btn-remove"
                >
                  Ta bort
                </button>
              )}
            </div>
          ))}
          <button 
            type="button" 
            onClick={() => addArrayField('producers')}
            className="btn-add"
          >
            + Lägg till producent
          </button>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Team *</label>
            <input
              type="text"
              name="team"
              value={formData.team}
              onChange={handleChange}
              placeholder="t.ex. Team Phoenix"
              className={errors.team ? 'error' : ''}
            />
            {errors.team && <span className="error-message">{errors.team}</span>}
          </div>

            <div className="form-group">
                <label>Ärendenummer *</label>
                <input
                    type="text"
                    name="ticketNumber"
                    value={formData.ticketNumber}
                    onChange={handleChange}
                    placeholder="t.ex. JIRA-1234 eller INC123456"
                    className={errors.ticketNumber ? 'error' : ''}
                />
                {errors.ticketNumber && <span className="error-message">{errors.ticketNumber}</span>}
                <small className="help-text">Används för branchnamn och spårbarhet</small>
            </div>

          <div className="form-group">
            <label>Beställare *</label>
            <input
              type="text"
              name="requester"
              value={formData.requester}
              onChange={handleChange}
              placeholder="Ditt namn"
              className={errors.requester ? 'error' : ''}
            />
            {errors.requester && <span className="error-message">{errors.requester}</span>}
          </div>
        </div>

        <div className="form-group">
          <label>Beskrivning</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            placeholder="Beskriv användningsområdet för denna kö/topic..."
          />
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Skickar...' : 'Skicka beställning'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QueueTopicForm;

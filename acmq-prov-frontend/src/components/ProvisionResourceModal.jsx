import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './Modal.css';

const ProvisionResourceModal = ({
                                    resourceType,
                                    mode,
                                    existingResource,
                                    onClose,
                                    onSuccess
                                }) => {
    console.log("inital state");
    console.log("ProvResourceMOdule laddad ")
    console.log(JSON.stringify(existingResource.producers))
    const [availableUsers, setAvailableUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);

    const [formData, setFormData] = useState({
        name: existingResource?.name || '',
        description: existingResource?.description || '',
        team: existingResource?.team || '',
        requester: '',
        ticketNumber: '',
        // Queue fields
        consumers: [],
        producers: [],
        // Topic fields
        subscriptions: []
    });

    const [newConsumer, setNewConsumer] = useState({ type: 'existing', value: '' });
    const [newProducer, setNewProducer] = useState({ type: 'existing', value: '' });
    const [newSubscription, setNewSubscription] = useState({
        name: '',
        subscriberType: 'existing',
        subscriber: '',
        nameManuallyEdited: false
    });
    const [newTopicPublisher, setNewTopicPublisher] = useState({ type: 'existing', value: '' });
    const [topicNameWarning, setTopicNameWarning] = useState('');

    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState(null);
    const [initialValues, setInitialValues] = useState(null);

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        // Pre-fill existing data when updating
        if (mode === 'update' && existingResource) {
            if (resourceType === 'topic') {
                const subscriptionsData = existingResource.subscriptions
                    ? (Array.isArray(existingResource.subscriptions)
                            ? existingResource.subscriptions.map(s => ({
                                name: s.name,
                                subscriber: s.subscriber,
                                isNew: false
                            }))
                            : Object.entries(existingResource.subscriptions).map(([name, subscriber]) => ({
                                name,
                                subscriber,
                                isNew: false
                            }))
                    )
                    : [];
                const producersData = (existingResource.producers || []).map(u => ({ name: u, isNew: false }));

                setFormData(prev => ({
                    ...prev,
                    subscriptions: subscriptionsData,
                    producers: producersData
                }));

                // Store initial values for change detection
                setInitialValues({
                    subscriptions: subscriptionsData,
                    producers: producersData
                });
            } else {
                const consumersData = (existingResource.consumers || []).map(u => ({ name: u, isNew: false }));
                const producersData = (existingResource.producers || []).map(u => ({ name: u, isNew: false }));

                setFormData(prev => ({
                    ...prev,
                    consumers: consumersData,
                    producers: producersData
                }));

                // Store initial values for change detection
                setInitialValues({
                    consumers: consumersData,
                    producers: producersData
                });
            }
        }
    }, [mode, existingResource, resourceType]);

    // Check topic name convention and set warning
    useEffect(() => {
        if (resourceType === 'topic' && formData.name) {
            if (!formData.name.toLowerCase().includes('.topic')) {
                setTopicNameWarning('Topic-namnet följer inte namnkonventionen (saknar ".topic")');
            } else {
                setTopicNameWarning('');
            }
        } else {
            setTopicNameWarning('');
        }
    }, [formData.name, resourceType]);

    // Generate subscription name when topic name or subscriber changes
    const generateSubscriptionName = (topicName, subscriberName) => {
        if (!topicName || !subscriberName) return '';

        const lowerTopicName = topicName.toLowerCase();
        const topicIndex = lowerTopicName.indexOf('.topic');

        if (topicIndex === -1) {
            // No .topic found, return empty - user must fill manually
            return '';
        }

        // Get everything after ".topic"
        const afterTopic = topicName.substring(topicIndex + 6); // +6 for ".topic"

        if (!afterTopic || afterTopic === '') {
            return `subscription-${subscriberName}`;
        }

        // Remove leading dot and replace remaining dots with dashes
        const cleanedPart = afterTopic.startsWith('.')
            ? afterTopic.substring(1).replace(/\./g, '-')
            : afterTopic.replace(/\./g, '-');

        return `${cleanedPart}-subscription-${subscriberName}`;
    };

    // Update subscription name when subscriber changes (if not manually edited)
    useEffect(() => {
        if (!newSubscription.nameManuallyEdited && newSubscription.subscriber) {
            const generatedName = generateSubscriptionName(formData.name, newSubscription.subscriber);
            setNewSubscription(prev => ({ ...prev, name: generatedName }));
        }
    }, [newSubscription.subscriber, formData.name, newSubscription.nameManuallyEdited]);

    const loadUsers = async () => {
        try {
            setLoadingUsers(true);
            const data = await api.getUsers();
            setAvailableUsers(data);
        } catch (err) {
            console.error('Failed to load users', err);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    // Queue: Consumer management
    const addConsumer = () => {
        if (!newConsumer.value.trim()) return;

        const exists = formData.consumers.some(c => c.name === newConsumer.value);
        if (exists) {
            setErrors(prev => ({ ...prev, consumer: 'Denna användare finns redan som konsument' }));
            return;
        }

        setFormData(prev => ({
            ...prev,
            consumers: [...prev.consumers, { name: newConsumer.value, isNew: newConsumer.type === 'new' }]
        }));
        setNewConsumer({ type: 'existing', value: '' });
        setErrors(prev => ({ ...prev, consumer: null }));
    };

    const removeConsumer = (name) => {
        setFormData(prev => ({
            ...prev,
            consumers: prev.consumers.filter(c => c.name !== name)
        }));
    };

    // Queue: Producer management
    const addProducer = () => {
        if (!newProducer.value.trim()) return;

        const exists = formData.producers.some(p => p.name === newProducer.value);
        if (exists) {
            setErrors(prev => ({ ...prev, producer: 'Denna användare finns redan som producent' }));
            return;
        }

        setFormData(prev => ({
            ...prev,
            producers: [...prev.producers, { name: newProducer.value, isNew: newProducer.type === 'new' }]
        }));
        setNewProducer({ type: 'existing', value: '' });
        setErrors(prev => ({ ...prev, producer: null }));
    };

    const removeProducer = (name) => {
        setFormData(prev => ({
            ...prev,
            producers: prev.producers.filter(p => p.name !== name)
        }));
    };

    // Topic: Publisher management
    const addTopicPublisher = () => {
        if (!newTopicPublisher.value.trim()) return;

        const exists = formData.producers.some(p => p.name === newTopicPublisher.value);
        if (exists) {
            setErrors(prev => ({ ...prev, publisher: 'Denna användare finns redan som publisher' }));
            return;
        }

        setFormData(prev => ({
            ...prev,
            producers: [...prev.producers, { name: newTopicPublisher.value, isNew: newTopicPublisher.type === 'new' }]
        }));
        setNewTopicPublisher({ type: 'existing', value: '' });
        setErrors(prev => ({ ...prev, publisher: null }));
    };

    // Topic: Subscription management
    const addSubscription = () => {
        if (!newSubscription.name.trim()) {
            setErrors(prev => ({ ...prev, subscription: 'Subscription-namn är obligatoriskt' }));
            return;
        }
        if (!newSubscription.subscriber.trim()) {
            setErrors(prev => ({ ...prev, subscription: 'Subscriber är obligatoriskt' }));
            return;
        }

        const exists = formData.subscriptions.some(s => s.name === newSubscription.name);
        if (exists) {
            setErrors(prev => ({ ...prev, subscription: 'En subscription med detta namn finns redan' }));
            return;
        }

        setFormData(prev => ({
            ...prev,
            subscriptions: [...prev.subscriptions, {
                name: newSubscription.name,
                subscriber: newSubscription.subscriber,
                isNew: newSubscription.subscriberType === 'new'
            }]
        }));
        setNewSubscription({ name: '', subscriberType: 'existing', subscriber: '', nameManuallyEdited: false });
        setErrors(prev => ({ ...prev, subscription: null }));
    };

    const removeSubscription = (subscriptionName) => {
        setFormData(prev => ({
            ...prev,
            subscriptions: prev.subscriptions.filter(s => s.name !== subscriptionName)
        }));
    };

    const handleSubscriptionNameChange = (e) => {
        setNewSubscription(prev => ({
            ...prev,
            name: e.target.value,
            nameManuallyEdited: true
        }));
    };

    const handleSubscriberChange = (subscriber) => {
        setNewSubscription(prev => ({
            ...prev,
            subscriber,
            // If name wasn't manually edited, it will be auto-generated by the useEffect
        }));
    };

    // Check if form has changes compared to initial values (for update mode)
    const hasChanges = () => {
        if (mode !== 'update' || !initialValues) return true;

        if (resourceType === 'topic') {
            // Check producers
            if (formData.producers.length !== initialValues.producers.length) return true;
            const currentProducerNames = formData.producers.map(p => p.name).sort();
            const initialProducerNames = initialValues.producers.map(p => p.name).sort();
            if (JSON.stringify(currentProducerNames) !== JSON.stringify(initialProducerNames)) return true;

            // Check subscriptions
            if (formData.subscriptions.length !== initialValues.subscriptions.length) return true;

            // Compare each subscription
            for (let i = 0; i < formData.subscriptions.length; i++) {
                const current = formData.subscriptions[i];
                const initial = initialValues.subscriptions.find(s => s.name === current.name && s.subscriber === current.subscriber);
                if (!initial) return true;
            }

            return false;
        } else {
            // Queue: Check consumers
            if (formData.consumers.length !== initialValues.consumers.length) return true;
            const currentConsumerNames = formData.consumers.map(c => c.name).sort();
            const initialConsumerNames = initialValues.consumers.map(c => c.name).sort();
            if (JSON.stringify(currentConsumerNames) !== JSON.stringify(initialConsumerNames)) return true;

            // Queue: Check producers
            if (formData.producers.length !== initialValues.producers.length) return true;
            const currentProducerNames = formData.producers.map(p => p.name).sort();
            const initialProducerNames = initialValues.producers.map(p => p.name).sort();
            if (JSON.stringify(currentProducerNames) !== JSON.stringify(initialProducerNames)) return true;

            return false;
        }
    };

    const validate = () => {
        const newErrors = {};

        if (mode === 'new') {
            if (!formData.name.trim()) {
                newErrors.name = 'Namn är obligatoriskt';
            } else if (!/^[a-zA-Z0-9._-]+$/.test(formData.name)) {
                newErrors.name = 'Endast bokstäver, siffror, punkt, underscore och bindestreck';
            }
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
            newErrors.ticketNumber = 'Endast bokstäver, siffror, underscore och bindestreck';
        }

        if (resourceType === 'topic') {
            if (formData.producers.length === 0) {
                newErrors.publisher = 'Minst en publisher måste anges';
            }
            if (formData.subscriptions.length === 0) {
                newErrors.general = 'Minst en subscription måste anges';
            }
        } else {
            if (formData.consumers.length === 0 && formData.producers.length === 0) {
                newErrors.general = 'Minst en konsument eller producent måste anges';
            }
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
            let payload;

            if (resourceType === 'topic') {
                payload = {
                    requestType: mode,
                    resourceType: resourceType,
                    name: formData.name,
                    description: formData.description,
                    team: formData.team,
                    requester: formData.requester,
                    ticketNumber: formData.ticketNumber,
                    // Backend expects: producers = [publishers], consumers = [subscribers]
                    producers: formData.producers.map(p => p.name),
                    consumers: formData.subscriptions.map(s => s.subscriber),
                    // Backend expects subscriptionName as single string (first subscription)
                    subscriptionName: formData.subscriptions.length > 0 ? formData.subscriptions[0].name : ''
                };
            } else {
                payload = {
                    requestType: mode,
                    resourceType: resourceType,
                    name: formData.name,
                    description: formData.description,
                    team: formData.team,
                    requester: formData.requester,
                    ticketNumber: formData.ticketNumber,
                    consumers: formData.consumers.map(c => c.name),
                    producers: formData.producers.map(p => p.name)
                };
            }

            const result = await api.createProvisioningOrder(payload);
            console.log("skickar payload till backend")
            console.log(payload)

            if (result.ok) {
                setSubmitResult({
                    type: 'success',
                    message: `Beställning skapad! Request ID: ${result.requestId}`,
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

    const isQueue = resourceType === 'queue';

    // Render Topic form
    const renderTopicForm = () => (
        <>
            {/* Topic Name */}
            <div className="form-group">
                <label className="form-label">Topic-namn *</label>
                <input
                    type="text"
                    name="name"
                    className={`form-control ${errors.name ? 'error' : ''}`}
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="t.ex. accounting.topic.report.results"
                    disabled={mode === 'update'}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
                {topicNameWarning && <span className="warning-text">{topicNameWarning}</span>}
            </div>

            <hr className="form-divider" />

            {/* Publishers Section */}
            <div className="user-assignment-section">
                <h4>Publishers</h4>
                <p className="section-description">
                    Tjänster/användare som ska kunna publicera meddelanden till denna topic
                </p>

                <div className="selected-users">
                    {formData.producers.map((publisher) => (
                        <div key={publisher.name} className="selected-user-tag">
                            <span className="badge badge-producer">P</span>
                            <span>{publisher.name}</span>
                            {publisher.isNew && <span className="new-indicator">(ny)</span>}
                            <button type="button" onClick={() => removeProducer(publisher.name)}>&times;</button>
                        </div>
                    ))}
                </div>

                <div className="add-user-row">
                    <div className="user-type-toggle">
                        <label className="user-type-option">
                            <input
                                type="radio"
                                checked={newTopicPublisher.type === 'existing'}
                                onChange={() => setNewTopicPublisher(prev => ({ ...prev, type: 'existing', value: '' }))}
                            />
                            Befintlig användare
                        </label>
                        <label className="user-type-option">
                            <input
                                type="radio"
                                checked={newTopicPublisher.type === 'new'}
                                onChange={() => setNewTopicPublisher(prev => ({ ...prev, type: 'new', value: '' }))}
                            />
                            Ny användare
                        </label>
                    </div>

                    <div className="add-user-input">
                        {newTopicPublisher.type === 'existing' ? (
                            <select
                                className="form-control form-select"
                                value={newTopicPublisher.value}
                                onChange={(e) => setNewTopicPublisher(prev => ({ ...prev, value: e.target.value }))}
                                disabled={loadingUsers}
                            >
                                <option value="">{loadingUsers ? 'Laddar...' : '-- Välj publisher --'}</option>
                                {availableUsers
                                    .filter(u => !formData.producers.some(p => p.name === u.name))
                                    .map((user) => (
                                        <option key={user.id} value={user.name}>
                                            {user.name}
                                        </option>
                                    ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                className="form-control"
                                value={newTopicPublisher.value}
                                onChange={(e) => setNewTopicPublisher(prev => ({ ...prev, value: e.target.value }))}
                                placeholder="Nytt användarnamn"
                            />
                        )}
                        <button type="button" className="btn btn-sm btn-success" onClick={addTopicPublisher}>
                            Lägg till
                        </button>
                    </div>
                    {errors.publisher && <span className="error-text">{errors.publisher}</span>}
                </div>
            </div>

            <hr className="form-divider" />

            {/* Subscriptions Section */}
            <div className="user-assignment-section">
                <h4>Subscriptions</h4>
                <p className="section-description">
                    Lägg till subscriptions. Subscription-namn genereras automatiskt baserat på namnkonventionen.
                </p>

                {formData.subscriptions.length > 0 && (
                    <div className="subscriptions-list">
                        {formData.subscriptions.map((sub) => (
                            <div key={sub.name} className="subscription-item">
                                <div className="subscription-info">
                                    <span className="badge badge-subscriber">SUB</span>
                                    <div className="subscription-details">
                                        <span className="subscription-name">{sub.name}</span>
                                        <span className="subscription-subscriber">
                      Subscriber: <strong>{sub.subscriber}</strong>
                                            {sub.isNew && <span className="new-indicator">(ny användare)</span>}
                    </span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-danger"
                                    onClick={() => removeSubscription(sub.name)}
                                >
                                    Ta bort
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="add-subscription-form">
                    {/* Subscriber and Subscription side by side - aligned at bottom */}
                    <div className="form-row-align-bottom">
                        <div className="form-group input-with-toggle">
                            <label className="form-label">Subscriber (Artemis-användare) *</label>
                            <div className="user-type-toggle">
                                <label className="user-type-option">
                                    <input
                                        type="radio"
                                        checked={newSubscription.subscriberType === 'existing'}
                                        onChange={() => setNewSubscription(prev => ({
                                            ...prev,
                                            subscriberType: 'existing',
                                            subscriber: '',
                                            name: '',
                                            nameManuallyEdited: false
                                        }))}
                                    />
                                    Befintlig
                                </label>
                                <label className="user-type-option">
                                    <input
                                        type="radio"
                                        checked={newSubscription.subscriberType === 'new'}
                                        onChange={() => setNewSubscription(prev => ({
                                            ...prev,
                                            subscriberType: 'new',
                                            subscriber: '',
                                            name: '',
                                            nameManuallyEdited: false
                                        }))}
                                    />
                                    Ny användare
                                </label>
                            </div>

                            {newSubscription.subscriberType === 'existing' ? (
                                <select
                                    className="form-control form-select"
                                    value={newSubscription.subscriber}
                                    onChange={(e) => handleSubscriberChange(e.target.value)}
                                    disabled={loadingUsers}
                                >
                                    <option value="">{loadingUsers ? 'Laddar...' : '-- Välj subscriber --'}</option>
                                    {availableUsers.map((user) => (
                                        <option key={user.id} value={user.name}>
                                            {user.name}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    className="form-control"
                                    value={newSubscription.subscriber}
                                    onChange={(e) => handleSubscriberChange(e.target.value)}
                                    placeholder="Nytt användarnamn"
                                />
                            )}
                        </div>

                        <div className="form-group input-with-toggle">
                            <label className="form-label">Subscription-namn *</label>
                            {topicNameWarning && (
                                <div className="field-hint warning">Fyll i manuellt (namnkonvention ej följd)</div>
                            )}
                            {!topicNameWarning && newSubscription.subscriber && (
                                <div className="field-hint">Genererat automatiskt - kan redigeras</div>
                            )}
                            <input
                                type="text"
                                className="form-control"
                                value={newSubscription.name}
                                onChange={handleSubscriptionNameChange}
                                placeholder={topicNameWarning ? "Fyll i subscription-namn manuellt" : "Genereras automatiskt..."}
                            />
                        </div>
                    </div>

                    <button type="button" className="btn btn-success" onClick={addSubscription}>
                        + Lägg till subscription
                    </button>
                    {errors.subscription && <span className="error-text">{errors.subscription}</span>}
                </div>
            </div>
        </>
    );

    // Render Queue form
    const renderQueueForm = () => (
        <>
            {/* Queue name field */}
            <div className="form-group">
                <label className="form-label">Namn på kö *</label>
                <input
                    type="text"
                    name="name"
                    className={`form-control ${errors.name ? 'error' : ''}`}
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="t.ex. order.processing.queue"
                    disabled={mode === 'update'}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <hr className="form-divider" />

            {/* Producers Section */}
            <div className="user-assignment-section">
                <h4>Producenter</h4>
                <p className="section-description">
                    Tjänster/användare som ska kunna skicka meddelanden till denna kö
                </p>
                {/* lägg till ta bort publisher för en Kö*/}
                <div className="selected-users">
                    {formData.producers.map((producer) => (
                        <div key={producer.name} className="selected-user-tag">
                            <span className="badge badge-producer">P</span>
                            <span>{producer.name}</span>
                            {producer.isNew && <span className="new-indicator">(ny)</span>}
                            <button type="button" onClick={() => removeProducer(producer.name)}>&times;</button>
                        </div>
                    ))}
                </div>

                <div className="add-user-row">
                    <div className="user-type-toggle">
                        <label className="user-type-option">
                            <input
                                type="radio"
                                checked={newProducer.type === 'existing'}
                                onChange={() => setNewProducer(prev => ({ ...prev, type: 'existing', value: '' }))}
                            />
                            Befintlig användare
                        </label>
                        <label className="user-type-option">
                            <input
                                type="radio"
                                checked={newProducer.type === 'new'}
                                onChange={() => setNewProducer(prev => ({ ...prev, type: 'new', value: '' }))}
                            />
                            Ny användare
                        </label>
                    </div>

                    <div className="add-user-input">
                        {newProducer.type === 'existing' ? (
                            <select
                                className="form-control form-select"
                                value={newProducer.value}
                                onChange={(e) => setNewProducer(prev => ({ ...prev, value: e.target.value }))}
                                disabled={loadingUsers}
                            >
                                <option value="">{loadingUsers ? 'Laddar...' : '-- Välj användare --'}</option>
                                {availableUsers
                                    .filter(u => !formData.producers.some(p => p.name === u.name))
                                    .map((user) => (
                                        <option key={user.id} value={user.name}>
                                            {user.name}
                                        </option>
                                    ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                className="form-control"
                                value={newProducer.value}
                                onChange={(e) => setNewProducer(prev => ({ ...prev, value: e.target.value }))}
                                placeholder="Nytt användarnamn"
                            />
                        )}
                        <button type="button" className="btn btn-sm btn-success" onClick={addProducer}>
                            Lägg till
                        </button>
                    </div>
                    {errors.producer && <span className="error-text">{errors.producer}</span>}
                </div>
            </div>

            {/* Consumers Section */}
            <div className="user-assignment-section">
                <h4>Konsumenter</h4>
                <p className="section-description">
                    Tjänster/användare som ska kunna ta emot meddelanden från denna kö
                </p>

                <div className="selected-users">
                    {formData.consumers.map((consumer) => (
                        <div key={consumer.name} className="selected-user-tag">
                            <span className="badge badge-consumer">C</span>
                            <span>{consumer.name}</span>
                            {consumer.isNew && <span className="new-indicator">(ny)</span>}
                            <button type="button" onClick={() => removeConsumer(consumer.name)}>&times;</button>
                        </div>
                    ))}
                </div>

                <div className="add-user-row">
                    <div className="user-type-toggle">
                        <label className="user-type-option">
                            <input
                                type="radio"
                                checked={newConsumer.type === 'existing'}
                                onChange={() => setNewConsumer(prev => ({ ...prev, type: 'existing', value: '' }))}
                            />
                            Befintlig användare
                        </label>
                        <label className="user-type-option">
                            <input
                                type="radio"
                                checked={newConsumer.type === 'new'}
                                onChange={() => setNewConsumer(prev => ({ ...prev, type: 'new', value: '' }))}
                            />
                            Ny användare
                        </label>
                    </div>

                    <div className="add-user-input">
                        {newConsumer.type === 'existing' ? (
                            <select
                                className="form-control form-select"
                                value={newConsumer.value}
                                onChange={(e) => setNewConsumer(prev => ({ ...prev, value: e.target.value }))}
                                disabled={loadingUsers}
                            >
                                <option value="">{loadingUsers ? 'Laddar...' : '-- Välj användare --'}</option>
                                {availableUsers
                                    .filter(u => !formData.consumers.some(c => c.name === u.name))
                                    .map((user) => (
                                        <option key={user.id} value={user.name}>
                                            {user.name}
                                        </option>
                                    ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                className="form-control"
                                value={newConsumer.value}
                                onChange={(e) => setNewConsumer(prev => ({ ...prev, value: e.target.value }))}
                                placeholder="Nytt användarnamn"
                            />
                        )}
                        <button type="button" className="btn btn-sm btn-success" onClick={addConsumer}>
                            Lägg till
                        </button>
                    </div>
                    {errors.consumer && <span className="error-text">{errors.consumer}</span>}
                </div>
            </div>
        </>
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>
                        {mode === 'new' ? 'Beställ ny' : 'Uppdatera'} {isQueue ? 'kö' : 'topic'}
                    </h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {submitResult && (
                            <div className={`alert alert-${submitResult.type}`}>
                                {submitResult.message}
                            </div>
                        )}

                        {errors.general && (
                            <div className="alert alert-error">{errors.general}</div>
                        )}

                        {/* Team, Beställare, Ärendenummer at the top */}
                        <div className="form-row-three">
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

                            <div className="form-group">
                                <label className="form-label">Ärendenummer *</label>
                                <input
                                    type="text"
                                    name="ticketNumber"
                                    className={`form-control ${errors.ticketNumber ? 'error' : ''}`}
                                    value={formData.ticketNumber}
                                    onChange={handleChange}
                                    placeholder="t.ex. INC123456"
                                />
                                {errors.ticketNumber && <span className="error-text">{errors.ticketNumber}</span>}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Beskrivning</label>
                            <textarea
                                name="description"
                                className="form-control"
                                value={formData.description}
                                onChange={handleChange}
                                rows={2}
                                placeholder={`Beskriv användningsområdet för denna ${isQueue ? 'kö' : 'topic'}...`}
                            />
                        </div>

                        <hr className="form-divider" />

                        {isQueue ? renderQueueForm() : renderTopicForm()}

                        <div className="info-box-highlight">
                            <strong>Information:</strong> Efter att beställningen skickats skapas en
                            Pull Request i konfigurationsrepot. Ändringarna blir aktiva efter
                            att PR:en har godkänts och mergats.
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Avbryt
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={submitting || !hasChanges()}>
                            {submitting ? 'Skickar...' : 'Skicka beställning'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProvisionResourceModal;
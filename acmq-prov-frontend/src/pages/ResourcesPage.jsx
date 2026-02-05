import React, {useState, useEffect, useCallback} from 'react';
import api from '../services/api';
import ProvisionResourceModal from '../components/ProvisionResourceModal';
import './ResourcesPage.css';

const ResourcesPage = () => {
    const [activeTab, setActiveTab] = useState('queues'); // queues or topics
    const [queues, setQueues] = useState([]);
    const [topics, setTopics] = useState([]);
    const [selectedResourceId, setSelectedResourceId] = useState('');
    const [selectedResource, setSelectedResource] = useState(null);
    const [loading, setLoading] = useState(true);
    const [resourceLoading, setResourceLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showProvisionModal, setShowProvisionModal] = useState(false);
    const [provisionMode, setProvisionMode] = useState('new'); // 'new' or 'update'

    const loadResourceDetails = useCallback(async (resourceId) => {
        try {
            setResourceLoading(true);
            setError(null);
            const data = activeTab === 'queues'
                ? await api.getQueueById(resourceId)
                : await api.getTopicById(resourceId);
            setSelectedResource(data);
            console.log("Tog emot resurs från backend: " + JSON.stringify(data))
        } catch (err) {
            setError('Kunde inte hämta resursdetaljer: ' + err.message);
        } finally {
            setResourceLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        console.log("selectedResource är: ")
        console.log(JSON.stringify(selectedResource))
    }, [showProvisionModal]);

    // Load queues and topics on mount
    useEffect(() => {
        loadResources();
    }, []);

    // Clear selection and error when tab changes
    useEffect(() => {
        setSelectedResourceId('');
        setSelectedResource(null);
        setError(null);
    }, [activeTab]);

    // Load resource details when selection changes
    useEffect(() => {
        if (selectedResourceId) {
            // Verify the resource exists in the current tab before fetching
            const currentResources = activeTab === 'queues' ? queues : topics;
            const resourceExists = currentResources.some(r => r.id === selectedResourceId);

            if (resourceExists) {
                loadResourceDetails(selectedResourceId);
            }
        } else {
            setSelectedResource(null);
        }
    }, [selectedResourceId, activeTab, queues, topics, loadResourceDetails]);

    const loadResources = async () => {
        try {
            setLoading(true);
            setError(null);
            const [queuesData, topicsData] = await Promise.all([
                api.getQueues(),
                api.getTopics()
            ]);
            setQueues(queuesData);
            setTopics(topicsData);
        } catch (err) {
            setError('Kunde inte hämta resurser: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleProvisionNew = () => {
        setProvisionMode('new');
        setShowProvisionModal(true);
    };

    const handleUpdateResource = () => {
        setProvisionMode('update');
        setShowProvisionModal(true);
    };

    const handleProvisionSuccess = () => {
        setShowProvisionModal(false);
        loadResources();
    };

    const currentResources = activeTab === 'queues' ? queues : topics;

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
                <h2 className="page-title">Köer & Topics</h2>
                <button className="btn btn-primary" onClick={handleProvisionNew}>
                    + Beställ ny {activeTab === 'queues' ? 'kö' : 'topic'}
                </button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="tabs-container">
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'queues' ? 'active' : ''}`}
                        onClick={() => setActiveTab('queues')}
                    >
                        Köer ({queues.length})
                    </button>
                    <button
                        className={`tab ${activeTab === 'topics' ? 'active' : ''}`}
                        onClick={() => setActiveTab('topics')}
                    >
                        Topics ({topics.length})
                    </button>
                </div>
            </div>

            <div className="resources-layout">
                <div className="resources-list-container card">
                    <div className="card-header">
                        <h3 className="card-title">
                            {activeTab === 'queues' ? 'Tillgängliga köer' : 'Tillgängliga topics'}
                        </h3>
                    </div>

                    {currentResources.length === 0 ? (
                        <div className="empty-state">
                            <p>Inga {activeTab === 'queues' ? 'köer' : 'topics'} hittades</p>
                        </div>
                    ) : (
                        <div className="resources-list">
                            {currentResources.map((resource) => (
                                <div
                                    key={resource.id}
                                    className={`resource-list-item ${selectedResourceId === resource.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedResourceId(resource.id)}
                                >
                                    <div className="resource-list-item-main">
                    <span className={`badge ${activeTab === 'queues' ? 'badge-queue' : 'badge-topic'}`}>
                      {activeTab === 'queues' ? 'Q' : 'T'}
                    </span>
                                        <span className="resource-list-item-name">{resource.name}</span>
                                    </div>
                                    <div className="resource-list-item-meta">
                                        <span className="team-name">{resource.team}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="resource-details-container">
                    {resourceLoading && (
                        <div className="loading">
                            <div className="spinner"></div>
                        </div>
                    )}

                    {selectedResource && !resourceLoading && (
                        <div className="resource-details">
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">{selectedResource.name}</h3>
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={handleUpdateResource}
                                    >
                                        Uppdatera
                                    </button>
                                </div>

                                <div className="resource-info">
                                    <div className="info-row">
                                        <span className="info-label">Typ:</span>
                                        <span
                                            className={`badge ${activeTab === 'queues' ? 'badge-queue' : 'badge-topic'}`}>
                      {activeTab === 'queues' ? 'Queue' : 'Topic'}
                    </span>
                                    </div>
                                    <div className="info-row">
                                        <span className="info-label">Team:</span>
                                        <span>{selectedResource.team}</span>
                                    </div>
                                    {selectedResource.description && (
                                        <div className="info-row">
                                            <span className="info-label">Beskrivning:</span>
                                            <span>{selectedResource.description}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="users-section">
                                {activeTab === 'queues' ? (
                                    <>
                                        {/* Queue: Producenter */}
                                        <div className="card">
                                            <div className="card-header">
                                                <h4 className="card-title">Producenter</h4>
                                                <span className="badge">{selectedResource.producers?.length || 0}</span>
                                            </div>
                                            {selectedResource.producers?.length > 0 ? (
                                                <div className="users-list">
                                                    {selectedResource.producers.map((user, index) => (
                                                        <div key={index} className="user-item">
                                                            <span className="badge badge-producer">P</span>
                                                            <span className="user-name">{user}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="no-users">Inga producenter konfigurerade</p>
                                            )}
                                        </div>

                                        {/* Queue: Konsumenter */}
                                        <div className="card">
                                            <div className="card-header">
                                                <h4 className="card-title">Konsumenter</h4>
                                                <span className="badge">{selectedResource.consumers?.length || 0}</span>
                                            </div>
                                            {selectedResource.consumers?.length > 0 ? (
                                                <div className="users-list">
                                                    {selectedResource.consumers.map((user, index) => (
                                                        <div key={index} className="user-item">
                                                            <span className="badge badge-consumer">C</span>
                                                            <span className="user-name">{user}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="no-users">Inga konsumenter konfigurerade</p>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Topic: Publishers */}
                                        <div className="card">
                                            <div className="card-header">
                                                <h4 className="card-title">Publishers</h4>
                                                <span className="badge">{selectedResource.producers?.length || 0}</span>
                                            </div>
                                            {selectedResource.producers?.length > 0 ? (
                                                <div className="users-list">
                                                    {selectedResource.producers.map((user, index) => (
                                                        <div key={index} className="user-item">
                                                            <span className="badge badge-producer">PUB</span>
                                                            <span className="user-name">{user}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="no-users">Inga publishers konfigurerade</p>
                                            )}
                                        </div>

                                        {/* Topic: Subscriptions with Subscribers */}
                                        <div className="card">
                                            <div className="card-header">
                                                <h4 className="card-title">Subscriptions</h4>
                                                <span className="badge">
                            {selectedResource.subscriptions ? Object.keys(selectedResource.subscriptions).length : (selectedResource.subscribers?.length || 0)}
                                                </span>
                                            </div>
                                            {/* If backend returns subscriptions with name/subscriber objects */}
                                            {selectedResource.subscriptions && Object.keys(selectedResource.subscriptions).length > 0 ? (
                                                <div className="subscriptions-detail-list">
                                                    {Object.entries(selectedResource.subscriptions).map(([subName, subscriber], index) => (
                                                        <div key={index} className="subscription-detail-item">
                                                            <div className="subscription-detail-name">
                                                                <span className="badge badge-subscriber">SUB</span>
                                                                <span className="subscription-name-text">{subName}</span>
                                                            </div>
                                                            <div className="subscription-detail-subscriber">
                                                                <span className="subscriber-arrow">→</span>
                                                                <span className="subscriber-label">Subscriber:</span>
                                                                <span className="subscriber-name">{subscriber}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : selectedResource.subscribers?.length > 0 ? (
                                                /* Fallback: backend returns subscribers as string array */
                                                <div className="users-list">
                                                    {selectedResource.subscribers.map((user, index) => (
                                                        <div key={index} className="user-item">
                                                            <span className="badge badge-subscriber">SUB</span>
                                                            <span className="user-name">{user}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="no-users">Inga subscriptions konfigurerade</p>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {!selectedResource && !resourceLoading && (
                        <div className="empty-state">
                            <div className="empty-state-icon">📋</div>
                            <p>Välj en {activeTab === 'queues' ? 'kö' : 'topic'} från listan för att se detaljer</p>
                            <p className="empty-state-hint">
                                Saknas en resurs?{' '}
                                <button className="btn-link" onClick={handleProvisionNew}>
                                    Beställ en ny {activeTab === 'queues' ? 'kö' : 'topic'}
                                </button>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {showProvisionModal && (
                <ProvisionResourceModal
                    resourceType={activeTab === 'queues' ? 'queue' : 'topic'}
                    mode={provisionMode}
                    existingResource={provisionMode === 'update' ? selectedResource : null}
                    onClose={() => setShowProvisionModal(false)}
                    onSuccess={handleProvisionSuccess}
                />
            )}
        </div>
    );
};

export default ResourcesPage;
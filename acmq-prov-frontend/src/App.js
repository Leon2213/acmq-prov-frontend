import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import UsersPage from './pages/UsersPage';
import ResourcesPage from './pages/ResourcesPage';
import './App.css';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<ResourcesPage />} />
                    <Route path="users" element={<UsersPage />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
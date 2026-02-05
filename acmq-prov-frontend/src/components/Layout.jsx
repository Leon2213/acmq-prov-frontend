import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './Layout.css';

const Layout = () => {
    return (
        <div className="layout">
            <header className="layout-header">
                <div className="header-content">
                    <h1>MQ Provisioning Portal</h1>
                    <p>Självbetjäningsportal för ActiveMQ Artemis</p>
                </div>
                <nav className="main-nav">
                    <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                        Köer & Topics
                    </NavLink>
                    <NavLink to="/users" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                        Användare
                    </NavLink>
                </nav>
            </header>
            <main className="layout-main">
                <Outlet />
            </main>
            <footer className="layout-footer">
                <p>ActiveMQ Artemis Provisioning Portal</p>
            </footer>
        </div>
    );
};

export default Layout;
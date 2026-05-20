import { Outlet, NavLink } from 'react-router-dom';
import { useAppStore } from '../stores/appStore.js';

export function Layout() {
  const notifications = useAppStore((s) => s.notifications);
  const dismiss = useAppStore((s) => s.dismissNotification);

  return (
    <div className="fc-layout">
      <nav className="fc-nav">
        <NavLink to="/" className="fc-nav__logo">
          <i className="ti ti-topology-star-3" /> FlowCamel
        </NavLink>
      </nav>
      <main className="fc-main">
        <Outlet />
      </main>
      <div className="fc-notifications">
        {notifications.map((n) => (
          <div key={n.id} className={`fc-notification fc-notification--${n.type}`}>
            {n.message}
            <button onClick={() => dismiss(n.id)}><i className="ti ti-x" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

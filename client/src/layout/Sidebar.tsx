import { NavLink, useNavigate } from "react-router-dom";
import { FilePlus, LayoutDashboard, LogOut, Upload } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import type { DocumentLists } from "../api/types";
import { initials } from "../lib/time";

type SidebarProps = {
  lists: DocumentLists | null;
  onNew: () => void;
  onImport: () => void;
};

export function Sidebar({ lists, onNew, onImport }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function signOut() {
    await logout();
    navigate("/login");
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <NavLink to="/" end className="login-brand">
          <div className="wordmark">Copydesk</div>
          <div className="wordmark-sub">Shared drafts</div>
        </NavLink>
      </div>

      <div className="sidebar-actions">
        <NavLink to="/" end className={({ isActive }) => `sidebar-btn ${isActive ? "is-active" : ""}`}>
          <LayoutDashboard size={15} />
          Documents
        </NavLink>
        <button className="sidebar-btn" type="button" onClick={onNew}>
          <FilePlus size={15} />
          New document
        </button>
        <button className="sidebar-btn" type="button" onClick={onImport}>
          <Upload size={15} />
          Import file
        </button>
      </div>

      <div className="sidebar-scroll">
        <div className="sidebar-label">Owned</div>
        <nav className="nav-list">
          {lists?.owned.length ? (
            lists.owned.map((doc) => (
              <NavLink key={doc.id} to={`/d/${doc.id}`} className={({ isActive }) => `nav-item ${isActive ? "is-active" : ""}`}>
                <span>{doc.title}</span>
              </NavLink>
            ))
          ) : (
            <div className="nav-empty">No documents yet</div>
          )}
        </nav>

        <div className="sidebar-label">Shared with me</div>
        <nav className="nav-list">
          {lists?.shared.length ? (
            lists.shared.map((doc) => (
              <NavLink key={doc.id} to={`/d/${doc.id}`} className={({ isActive }) => `nav-item ${isActive ? "is-active" : ""}`}>
                <span>{doc.title}</span>
              </NavLink>
            ))
          ) : (
            <div className="nav-empty">Nothing shared</div>
          )}
        </nav>
      </div>

      {user ? (
        <div className="sidebar-footer">
          <button className="user-chip" type="button" onClick={signOut} title="Sign out">
            <span className="avatar">{initials(user.name)}</span>
            <span className="grow">
              <span className="user-name">{user.name}</span>
              <small>{user.email}</small>
            </span>
            <LogOut size={14} />
          </button>
        </div>
      ) : null}
    </aside>
  );
}

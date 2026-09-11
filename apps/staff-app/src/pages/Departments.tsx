import { useState, useEffect, type FormEvent } from 'react';
import { apiFetch, ApiError } from '../lib/api';

interface Department {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  _count: { doctors: number };
}

export default function DepartmentsPage() {

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<Department[]>('/departments');
      setDepartments(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormName('');
    setFormDescription('');
    setFormError('');
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (dept: Department) => {
    setEditingId(dept.id);
    setFormName(dept.name);
    setFormDescription(dept.description || '');
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);

    try {
      if (editingId) {
        await apiFetch(`/departments/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({ name: formName, description: formDescription || undefined }),
        });
      } else {
        await apiFetch('/departments', {
          method: 'POST',
          body: JSON.stringify({ name: formName, description: formDescription || undefined }),
        });
      }
      resetForm();
      await loadDepartments();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to save department');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (dept: Department) => {
    try {
      await apiFetch(`/departments/${dept.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !dept.isActive }),
      });
      await loadDepartments();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update department');
    }
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Departments</h1>
          <p className="page-subtitle">Manage hospital departments</p>
        </div>
        <div className="data-table-skeleton">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton skeleton-card" style={{ height: '60px', marginBottom: '8px' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Departments</h1>
          <p className="page-subtitle">Manage hospital departments and their assigned doctors</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateForm} id="add-department-btn">
          + Add Department
        </button>
      </div>

      {error && (
        <div className="login-alert login-alert-error" style={{ marginBottom: 'var(--space-4)' }}>
          {error}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal-backdrop" onClick={resetForm}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 'var(--space-6)' }}>
              {editingId ? 'Edit Department' : 'New Department'}
            </h2>

            {formError && (
              <div className="login-alert login-alert-error" style={{ marginBottom: 'var(--space-4)' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label className="form-label" htmlFor="dept-name">Name</label>
                <input
                  id="dept-name"
                  className="form-input"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Cardiology"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="dept-desc">Description (optional)</label>
                <input
                  id="dept-desc"
                  className="form-input"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brief description of the department"
                />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving} id="save-department-btn">
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="data-table-container">
        <div className="table-responsive-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ minWidth: '160px' }}>Name</th>
                <th style={{ minWidth: '200px' }}>Description</th>
                <th style={{ minWidth: '90px' }}>Doctors</th>
                <th style={{ minWidth: '100px' }}>Status</th>
                <th style={{ minWidth: '160px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-tertiary)' }}>
                    No departments yet. Click "Add Department" to create one.
                  </td>
                </tr>
              ) : (
                departments.map((dept) => (
                  <tr key={dept.id}>
                    <td style={{ fontWeight: 'var(--font-weight-medium)' }}>{dept.name}</td>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                      {dept.description || '—'}
                    </td>
                    <td>{dept._count.doctors}</td>
                    <td>
                      <span className={`status-badge ${dept.isActive ? 'status-badge-active' : 'status-badge-inactive'}`}>
                        {dept.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEditForm(dept)}>Edit</button>
                        <button
                          className={`btn btn-sm ${dept.isActive ? 'btn-ghost' : 'btn-primary'}`}
                          onClick={() => handleToggleActive(dept)}
                          style={dept.isActive ? { color: 'var(--color-danger-600)' } : {}}
                        >
                          {dept.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, type FormEvent } from 'react';
import { apiFetch, ApiError } from '../lib/api';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  bio: string | null;
  consultationFee: string;
  slotDurationMins: number;
  photoUrl: string | null;
  isActive: boolean;
  departments: { department: { id: string; name: string } }[];
  user: { email: string; phone: string; isActive: boolean };
}

interface Department {
  id: string;
  name: string;
}

export default function DoctorsPage() {

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    name: '',
    specialization: '',
    bio: '',
    consultationFee: '',
    slotDurationMins: '15',
    departmentIds: [] as string[],
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Department assignment state
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assignDeptIds, setAssignDeptIds] = useState<string[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [docRes, deptRes] = await Promise.all([
        apiFetch<Doctor[]>('/doctors'),
        apiFetch<Department[]>('/departments?active=true'),
      ]);
      setDoctors(docRes.data);
      setDepartments(deptRes.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      email: '', phone: '', password: '', name: '', specialization: '',
      bio: '', consultationFee: '', slotDurationMins: '15', departmentIds: [],
    });
    setFormError('');
  };

  const openEditForm = (doc: Doctor) => {
    setEditingId(doc.id);
    setFormData({
      email: doc.user.email,
      phone: doc.user.phone || '',
      password: '',
      name: doc.name,
      specialization: doc.specialization,
      bio: doc.bio || '',
      consultationFee: doc.consultationFee,
      slotDurationMins: String(doc.slotDurationMins),
      departmentIds: doc.departments.map((d) => d.department.id),
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);

    try {
      if (editingId) {
        await apiFetch(`/doctors/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: formData.name,
            specialization: formData.specialization,
            bio: formData.bio || undefined,
            consultationFee: parseFloat(formData.consultationFee),
            slotDurationMins: parseInt(formData.slotDurationMins),
          }),
        });
      } else {
        await apiFetch('/doctors', {
          method: 'POST',
          body: JSON.stringify({
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            name: formData.name,
            specialization: formData.specialization,
            bio: formData.bio || undefined,
            consultationFee: parseFloat(formData.consultationFee),
            slotDurationMins: parseInt(formData.slotDurationMins),
            departmentIds: formData.departmentIds,
          }),
        });
      }
      resetForm();
      await loadData();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to save doctor');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (doc: Doctor) => {
    try {
      await apiFetch(`/doctors/${doc.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !doc.isActive }),
      });
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update doctor');
    }
  };

  const openDeptAssignment = (doc: Doctor) => {
    setAssigningId(doc.id);
    setAssignDeptIds(doc.departments.map((d) => d.department.id));
  };

  const handleAssignDepts = async () => {
    if (!assigningId) return;
    try {
      await apiFetch(`/doctors/${assigningId}/departments`, {
        method: 'PUT',
        body: JSON.stringify({ departmentIds: assignDeptIds }),
      });
      setAssigningId(null);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to assign departments');
    }
  };

  const toggleDeptId = (id: string) => {
    setAssignDeptIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  };

  const toggleFormDeptId = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      departmentIds: prev.departmentIds.includes(id)
        ? prev.departmentIds.filter((d) => d !== id)
        : [...prev.departmentIds, id],
    }));
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Doctors</h1>
          <p className="page-subtitle">Manage hospital doctors</p>
        </div>
        <div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton skeleton-card" style={{ height: '80px', marginBottom: '8px' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Doctors</h1>
          <p className="page-subtitle">Manage doctor profiles, fees, and department assignments</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }} id="add-doctor-btn">
          + Add Doctor
        </button>
      </div>

      {error && (
        <div className="login-alert login-alert-error" style={{ marginBottom: 'var(--space-4)' }}>
          {error}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="modal-backdrop" onClick={resetForm}>
          <div className="modal-card modal-card-wide" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 'var(--space-6)' }}>
              {editingId ? 'Edit Doctor' : 'New Doctor'}
            </h2>

            {formError && (
              <div className="login-alert login-alert-error" style={{ marginBottom: 'var(--space-4)' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                {!editingId && (
                  <>
                    <div className="form-group">
                      <label className="form-label" htmlFor="doc-email">Email</label>
                      <input id="doc-email" className="form-input" type="email" required
                        value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="doctor@hospital.com"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="doc-phone">Phone</label>
                      <input id="doc-phone" className="form-input" type="tel" required
                        value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Phone number"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="doc-password">Password</label>
                      <input id="doc-password" className="form-input" type="password" required minLength={8}
                        value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Min 8 characters"
                      />
                    </div>
                  </>
                )}
                <div className="form-group">
                  <label className="form-label" htmlFor="doc-name">Full Name</label>
                  <input id="doc-name" className="form-input" required
                    value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Dr. Full Name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="doc-spec">Specialization</label>
                  <input id="doc-spec" className="form-input" required
                    value={formData.specialization} onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    placeholder="e.g., Cardiologist"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="doc-fee">Consultation Fee (₹)</label>
                  <input id="doc-fee" className="form-input" type="number" step="0.01" min="0" required
                    value={formData.consultationFee} onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                    placeholder="500"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="doc-slot">Slot Duration (mins)</label>
                  <input id="doc-slot" className="form-input" type="number" min="5" max="120"
                    value={formData.slotDurationMins} onChange={(e) => setFormData({ ...formData, slotDurationMins: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                <label className="form-label" htmlFor="doc-bio">Bio (optional)</label>
                <input id="doc-bio" className="form-input"
                  value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Brief professional bio"
                />
              </div>

              {!editingId && departments.length > 0 && (
                <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                  <label className="form-label">Departments</label>
                  <div className="checkbox-group">
                    {departments.map((dept) => (
                      <label key={dept.id} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.departmentIds.includes(dept.id)}
                          onChange={() => toggleFormDeptId(dept.id)}
                        />
                        {dept.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving} id="save-doctor-btn">
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Create Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Department Assignment Modal */}
      {assigningId && (
        <div className="modal-backdrop" onClick={() => setAssigningId(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 'var(--space-6)' }}>Assign Departments</h2>
            <div className="checkbox-group">
              {departments.map((dept) => (
                <label key={dept.id} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={assignDeptIds.includes(dept.id)}
                    onChange={() => toggleDeptId(dept.id)}
                  />
                  {dept.name}
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
              <button className="btn btn-secondary" onClick={() => setAssigningId(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAssignDepts}>Save Assignments</button>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Table */}
      <div className="data-table-container">
        <div className="table-responsive-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ minWidth: '160px' }}>Doctor</th>
                <th style={{ minWidth: '140px' }}>Specialization</th>
                <th style={{ minWidth: '140px' }}>Departments</th>
                <th style={{ minWidth: '90px' }}>Fee</th>
                <th style={{ minWidth: '80px' }}>Slot</th>
                <th style={{ minWidth: '100px' }}>Status</th>
                <th style={{ minWidth: '170px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-tertiary)' }}>
                    No doctors yet. Click "Add Doctor" to create one.
                  </td>
                </tr>
              ) : (
                doctors.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ fontWeight: 'var(--font-weight-medium)' }}>{doc.name}</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>{doc.user.email}</div>
                    </td>
                    <td>{doc.specialization}</td>
                    <td>
                      {doc.departments.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
                          {doc.departments.map((d) => (
                            <span key={d.department.id} className="dept-tag">{d.department.name}</span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>None</span>
                      )}
                    </td>
                    <td>₹{doc.consultationFee}</td>
                    <td>{doc.slotDurationMins}m</td>
                    <td>
                      <span className={`status-badge ${doc.isActive ? 'status-badge-active' : 'status-badge-inactive'}`}>
                        {doc.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEditForm(doc)}>Edit</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => openDeptAssignment(doc)}>Depts</button>
                        <button
                          className={`btn btn-sm ${doc.isActive ? 'btn-ghost' : 'btn-primary'}`}
                          onClick={() => handleToggleActive(doc)}
                          style={doc.isActive ? { color: 'var(--color-danger-600)' } : {}}
                        >
                          {doc.isActive ? 'Deactivate' : 'Activate'}
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

import { useState } from 'react';
import { useUsers, useDeleteUser } from '../hooks/useUsers';
import { UserForm } from './UserForm';
import { User, UserRole } from '../../../types/auth';

export const UserList = () => {
  const { data: users, isLoading, error } = useUsers();
  const { mutate: deleteUser } = useDeleteUser();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  console.log('UserList render:', { users, isLoading, error });

  const handleDelete = (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
      deleteUser(userId);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading users...</div>;
  }

  if (error) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ color: '#dc3545', marginBottom: '1rem' }}>
          Error loading users. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <h1>Manage Users</h1>
        {!showCreateForm && (
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            Create User
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Create New User</h3>
          <UserForm
            onSuccess={() => setShowCreateForm(false)}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {editingId && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Edit User</h3>
          <UserForm
            userId={editingId}
            onSuccess={() => setEditingId(null)}
            onCancel={() => setEditingId(null)}
          />
        </div>
      )}

      {users && users.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              backgroundColor: 'white',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: '#f8f9fa',
                  borderBottom: '2px solid #dee2e6',
                }}
              >
                <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Role</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Created</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: User) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>
                    {user.name}
                  </td>
                  <td style={{ padding: '1rem' }}>{user.email}</td>
                  <td style={{ padding: '1rem' }}>
                    <span
                      style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor:
                          user.role === UserRole.ADMIN ? '#e7d4f5' : '#d1ecf1',
                        color:
                          user.role === UserRole.ADMIN ? '#6f42c1' : '#0c5460',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    >
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '1rem',
                      fontSize: '0.875rem',
                      color: '#666',
                    }}
                  >
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <button
                        className="btn btn-secondary"
                        style={{
                          padding: '0.25rem 0.75rem',
                          fontSize: '0.875rem',
                        }}
                        onClick={() => setEditingId(user.id)}
                        disabled={editingId === user.id}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{
                          padding: '0.25rem 0.75rem',
                          fontSize: '0.875rem',
                        }}
                        onClick={() => handleDelete(user.id, user.name)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            No users found.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            Create Your First User
          </button>
        </div>
      )}
    </div>
  );
};

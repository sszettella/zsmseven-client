import { useAuth } from '@/features/auth/hooks/useAuth';
import { UserForm } from './UserForm';
import { useNavigate } from 'react-router-dom';

export const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Just show a success message, stay on the page
    alert('Profile updated successfully!');
  };

  const handleCancel = () => {
    navigate(-1); // Go back to previous page
  };

  if (!user) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>My Profile</h1>
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Edit Your Profile</h3>
        <UserForm
          userId={user.id}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

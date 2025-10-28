import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateUser, useUpdateUser, useUser } from '../hooks/useUsers';
import { UserRole } from '../../../types/auth';

const userSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .optional()
    .or(z.literal('')),
  role: z.nativeEnum(UserRole),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  userId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const UserForm = ({ userId, onSuccess, onCancel }: UserFormProps) => {
  const { data: user } = useUser(userId || '');
  const { mutate: createUser, isPending: isCreating } = useCreateUser();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: user
      ? { name: user.name, email: user.email, role: user.role, password: '' }
      : { role: UserRole.USER, name: '', email: '', password: '' },
  });

  const isPending = isCreating || isUpdating;

  const onSubmit = (data: UserFormData) => {
    if (userId && user) {
      // Update existing user
      const updateData: any = {
        name: data.name,
        email: data.email,
        role: data.role,
      };
      // Only include password if it was provided
      if (data.password && data.password.length > 0) {
        updateData.password = data.password;
      }
      updateUser({ id: userId, data: updateData }, { onSuccess });
    } else {
      // Create new user - password is required
      if (!data.password || data.password.length === 0) {
        return;
      }
      createUser(
        {
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
        },
        { onSuccess }
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1rem',
        }}
      >
        <div className="form-group">
          <label className="form-label" htmlFor="name">
            Name *
          </label>
          <input
            {...register('name')}
            type="text"
            id="name"
            className="form-control"
            placeholder="John Doe"
          />
          {errors.name && (
            <p className="error-message">{errors.name.message}</p>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="email">
            Email *
          </label>
          <input
            {...register('email')}
            type="email"
            id="email"
            className="form-control"
            placeholder="user@example.com"
          />
          {errors.email && (
            <p className="error-message">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="password">
          Password {!userId && '*'}
        </label>
        <input
          {...register('password')}
          type="password"
          id="password"
          className="form-control"
          placeholder={userId ? 'Leave blank to keep current password' : '••••••••'}
        />
        {errors.password && (
          <p className="error-message">{errors.password.message}</p>
        )}
        {userId && (
          <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
            Leave blank to keep the current password
          </p>
        )}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="role">
          Role *
        </label>
        <select {...register('role')} id="role" className="form-control">
          <option value={UserRole.USER}>User</option>
          <option value={UserRole.ADMIN}>Admin</option>
        </select>
        {errors.role && (
          <p className="error-message">{errors.role.message}</p>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          justifyContent: 'flex-end',
          marginTop: '1rem',
        }}
      >
        {onCancel && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isPending}
        >
          {isPending ? 'Saving...' : userId ? 'Update User' : 'Create User'}
        </button>
      </div>
    </form>
  );
};

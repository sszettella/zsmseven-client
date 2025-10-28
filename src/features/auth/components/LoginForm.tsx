import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLogin } from '../hooks/useAuth';
import { LoginCredentials } from '@/types/auth';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const LoginForm = () => {
  const { mutate: login, isPending, error } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginCredentials) => {
    login(data);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px' }}>
      <div className="card">
        <h2 style={{ marginBottom: '1.5rem' }}>Login to Financial Tracker</h2>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              id="email"
              className="form-control"
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="error-message">{errors.email.message}</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              id="password"
              className="form-control"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="error-message">{errors.password.message}</p>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                style={{ marginRight: '0.5rem' }}
              />
              Show password
            </label>
          </div>

          {error && (
            <div
              style={{
                padding: '0.75rem',
                backgroundColor: '#f8d7da',
                color: '#721c24',
                borderRadius: '4px',
                marginBottom: '1rem',
              }}
            >
              Login failed. Please check your credentials.
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isPending}
            style={{ width: '100%' }}
          >
            {isPending ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

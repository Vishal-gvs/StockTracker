import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../services/api';
import { useAuth } from '../auth/AuthProvider';
import { UserPlus } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email(),
  password: z.string().min(6),
  adminCode: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const handleGoogleSuccess = async (credentialResponse: any) => {
      try {
        if (credentialResponse.credential) {
          const decoded: any = jwtDecode(credentialResponse.credential);
          const { name, email, sub: googleId } = decoded;
          
          const res = await api.post('/auth/google', {
            name,
            email,
            googleId 
          }); 
          login(res.data.user); 
        }
      } catch (e) {
        console.error(e);
        alert('Google Login Failed');
      }
  };

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.post('/auth/register', data);
      login(res.data.user);
      navigate('/'); 
    } catch (error: any) {
      alert(error.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Create Account</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input {...register('name')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
            {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input {...register('email')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
            {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" {...register('password')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
            {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Admin Code (Optional)</label>
            <input type="password" {...register('adminCode')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" placeholder="For admins only" />
          </div>

          <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
            <UserPlus className="w-4 h-4 mr-2" /> Register
          </button>
        </form>

        <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
                Already have an account? <Link to="/login" className="text-indigo-600 hover:text-indigo-500">Sign in</Link>
            </p>
        </div>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => console.log('Login Failed')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

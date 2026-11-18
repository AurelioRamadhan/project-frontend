'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

const schema = z.object({
  name: z.string().min(1, 'Nama wajib'),
  email: z.string().email(),
  password: z.string().min(6, 'Minimal 6 karakter'),
  role: z.enum(['PM', 'INTERNAL', 'CLIENT']),
  department: z.enum(['PRODUCT', 'UIUX', 'FRONTEND', 'BACKEND', 'CLIENT']),
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'INTERNAL', department: 'FRONTEND' },
  });

  const role = watch('role');

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const res = await api.post('/api/auth/register', data);
      setAuth(res.data.user, res.data.token);
      router.push(res.data.user.role === 'CLIENT' ? '/client' : '/dashboard');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Register gagal');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg space-y-6">
        <h1 className="text-2xl font-bold text-blue-900 text-center">Daftar Akun</h1>
        {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</p>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div><Label>Nama</Label><Input {...register('name')} />{errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}</div>
          <div><Label>Email</Label><Input type="email" {...register('email')} />{errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}</div>
          <div><Label>Password</Label><Input type="password" {...register('password')} />{errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}</div>
          <div>
            <Label>Role</Label>
            <select {...register('role')} className="w-full border rounded-md p-2">
              <option value="PM">Product Manager</option>
              <option value="INTERNAL">Internal Team</option>
              <option value="CLIENT">Client</option>
            </select>
          </div>
          {role !== 'CLIENT' && (
            <div>
              <Label>Department</Label>
              <select {...register('department')} className="w-full border rounded-md p-2">
                <option value="PRODUCT">Product</option>
                <option value="UIUX">UI/UX</option>
                <option value="FRONTEND">Frontend</option>
                <option value="BACKEND">Backend</option>
              </select>
            </div>
          )}
          <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700">
            {isSubmitting ? 'Memproses...' : 'Daftar'}
          </Button>
        </form>
        <p className="text-center text-sm text-slate-500">
          Sudah punya akun? <Link href="/login" className="text-blue-600 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
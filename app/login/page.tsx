'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error } = await signIn(email, password);

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push('/dashboard');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 50%, #f0fdf4 100%)',
            padding: '1rem',
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                background: 'white',
                borderRadius: '1rem',
                padding: '2rem',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                border: '1px solid #e5e7eb',
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <h1 style={{
                        fontSize: '2.25rem',
                        fontWeight: 700,
                        color: '#059669',
                        margin: 0,
                    }}>
                        MyFo
                    </h1>
                    <p style={{ color: '#6b7280', marginTop: '0.25rem', fontSize: '0.875rem' }}>
                        Your Financial Officer
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            color: '#374151',
                            marginBottom: '0.375rem',
                        }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                border: '1px solid #d1d5db',
                                background: '#f9fafb',
                                color: '#111827',
                                fontSize: '0.875rem',
                                outline: 'none',
                                boxSizing: 'border-box',
                            }}
                            placeholder="you@example.com"
                        />
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            color: '#374151',
                            marginBottom: '0.375rem',
                        }}>
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                border: '1px solid #d1d5db',
                                background: '#f9fafb',
                                color: '#111827',
                                fontSize: '0.875rem',
                                outline: 'none',
                                boxSizing: 'border-box',
                            }}
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            color: '#dc2626',
                            fontSize: '0.8rem',
                            marginBottom: '1.25rem',
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '0.875rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            background: '#10b981',
                            color: 'white',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                        }}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p style={{
                    textAlign: 'center',
                    marginTop: '1.25rem',
                    color: '#6b7280',
                    fontSize: '0.8rem',
                }}>
                    Don't have an account?{' '}
                    <Link href="/register" style={{
                        color: '#10b981',
                        textDecoration: 'none',
                        fontWeight: 500,
                    }}>
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}

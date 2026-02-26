/**
 * AdminPanel.jsx — Full admin dashboard with tabs: Overview, Users, Items, Reviews
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAuthStore from '@/store/authStore'
import {
    getAdminStats,
    getAdminUsers,
    deleteUser,
    banUser,
    getAdminItems,
    deleteItemAdmin,
    getAdminReviews,
    deleteReviewAdmin,
} from '@/api/adminApi'
import { Users, Package, Star, FileText, Trash2, Search, ChevronLeft, ChevronRight, Shield, Ban, LogOut } from 'lucide-react'

const TABS = [
    { key: 'overview', label: 'Overview', Icon: Shield },
    { key: 'users', label: 'Users', Icon: Users },
    { key: 'items', label: 'Items', Icon: Package },
    { key: 'reviews', label: 'Reviews', Icon: Star },
]

export default function AdminPanel() {
    const [tab, setTab] = useState('overview')
    const user = useAuthStore((s) => s.user)
    const clearAuth = useAuthStore((s) => s.clearAuth)
    const isRestoring = useAuthStore((s) => s.isRestoring)
    const navigate = useNavigate()

    // Wait for session restore before checking role
    if (isRestoring) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', color: 'var(--text-2)' }}>Loading…</div>
    }

    // Guard: redirect non-admins
    if (!user || user.role !== 'admin') {
        navigate('/dashboard')
        return null
    }

    const handleLogout = () => {
        clearAuth()
        navigate('/login')
    }

    return (
        <div className="admin-panel">
            <div className="admin-sidebar">
                <div className="admin-sidebar-brand">
                    <Shield size={20} />
                    <span>Admin</span>
                </div>
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        className={`admin-tab ${tab === t.key ? 'active' : ''}`}
                        onClick={() => setTab(t.key)}
                    >
                        <t.Icon size={16} />
                        <span>{t.label}</span>
                    </button>
                ))}
                <div style={{ flex: 1 }} />
                <button className="admin-tab" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
                    <LogOut size={16} />
                    <span>Sign Out</span>
                </button>
            </div>

            <div className="admin-main">
                {tab === 'overview' && <OverviewTab />}
                {tab === 'users' && <UsersTab />}
                {tab === 'items' && <ItemsTab />}
                {tab === 'reviews' && <ReviewsTab />}
            </div>
        </div>
    )
}

/* ── Overview ─────────────────────────────────────────────── */
function OverviewTab() {
    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'stats'],
        queryFn: getAdminStats,
    })

    const stats = [
        { label: 'Total Users', value: data?.totalUsers ?? '—', Icon: Users, color: '#6366f1' },
        { label: 'Total Items', value: data?.totalItems ?? '—', Icon: Package, color: '#10b981' },
        { label: 'Total Reviews', value: data?.totalReviews ?? '—', Icon: Star, color: '#f59e0b' },
        { label: 'Total Requests', value: data?.totalRequests ?? '—', Icon: FileText, color: '#ef4444' },
    ]

    return (
        <div>
            <h1 className="admin-page-title">Dashboard Overview</h1>
            <div className="admin-stats-grid">
                {stats.map((s) => (
                    <div key={s.label} className="admin-stat-card">
                        <div className="admin-stat-icon" style={{ background: `${s.color}20`, color: s.color }}>
                            <s.Icon size={22} />
                        </div>
                        <div>
                            <div className="admin-stat-value">{isLoading ? '…' : s.value.toLocaleString()}</div>
                            <div className="admin-stat-label">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

/* ── Users ────────────────────────────────────────────────── */
function UsersTab() {
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const qc = useQueryClient()

    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'users', page, search],
        queryFn: () => getAdminUsers({ page, limit: 15, search }),
        keepPreviousData: true,
    })

    const del = useMutation({
        mutationFn: deleteUser,
        onSuccess: () => { toast.success('User deleted'); qc.invalidateQueries({ queryKey: ['admin'] }) },
        onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
    })

    const ban = useMutation({
        mutationFn: banUser,
        onSuccess: (data) => { toast.success(data.message); qc.invalidateQueries({ queryKey: ['admin'] }) },
        onError: (err) => toast.error(err.response?.data?.message || 'Ban failed'),
    })

    return (
        <div>
            <h1 className="admin-page-title">Users</h1>
            <div className="admin-toolbar">
                <div className="admin-search">
                    <Search size={16} />
                    <input placeholder="Search by name or email…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
                </div>
            </div>
            <div className="admin-table-wrap">
                <table className="admin-table">
                    <thead>
                        <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th></th></tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>Loading…</td></tr>
                        ) : data?.users?.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>No users found</td></tr>
                        ) : data?.users?.map((u) => (
                            <tr key={u._id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div className="admin-avatar">{u.name?.[0] || '?'}</div>
                                        <span>{u.name}</span>
                                    </div>
                                </td>
                                <td><span style={{ color: 'var(--text-2)' }}>{u.email}</span></td>
                                <td><span className={`admin-badge ${u.role === 'admin' ? 'admin-badge-admin' : ''}`}>{u.role}</span></td>
                                <td>
                                    {u.isBanned
                                        ? <span className="admin-badge" style={{ background: 'rgba(239,68,68,.12)', color: '#ef4444' }}>Banned</span>
                                        : <span className="admin-badge admin-badge-green">Active</span>
                                    }
                                </td>
                                <td><span style={{ color: 'var(--text-3)', fontSize: 13 }}>{new Date(u.createdAt).toLocaleDateString()}</span></td>
                                <td>
                                    {u.role !== 'admin' && (
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <button
                                                className="admin-ban-btn"
                                                title={u.isBanned ? 'Unban user' : 'Ban user'}
                                                onClick={() => ban.mutate(u._id)}
                                                style={u.isBanned ? { background: 'rgba(16,185,129,.1)', color: '#10b981' } : {}}
                                            >
                                                <Ban size={14} />
                                            </button>
                                            <button className="admin-delete-btn" onClick={() => { if (confirm(`Delete user "${u.name}"? This will also remove all their items, reviews, and requests.`)) del.mutate(u._id) }}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {data && <Pagination page={page} pages={data.pages} setPage={setPage} />}
        </div>
    )
}

/* ── Items ────────────────────────────────────────────────── */
function ItemsTab() {
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const qc = useQueryClient()

    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'items', page, search],
        queryFn: () => getAdminItems({ page, limit: 15, search }),
        keepPreviousData: true,
    })

    const del = useMutation({
        mutationFn: deleteItemAdmin,
        onSuccess: () => { toast.success('Item deleted'); qc.invalidateQueries({ queryKey: ['admin'] }) },
        onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
    })

    return (
        <div>
            <h1 className="admin-page-title">Items</h1>
            <div className="admin-toolbar">
                <div className="admin-search">
                    <Search size={16} />
                    <input placeholder="Search by title…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
                </div>
            </div>
            <div className="admin-table-wrap">
                <table className="admin-table">
                    <thead>
                        <tr><th>Item</th><th>Owner</th><th>Category</th><th>Price/Day</th><th>Status</th><th></th></tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>Loading…</td></tr>
                        ) : data?.items?.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>No items found</td></tr>
                        ) : data?.items?.map((item) => (
                            <tr key={item._id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        {item.images?.[0] ? (
                                            <img src={item.images[0]} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={16} /></div>
                                        )}
                                        <span>{item.title}</span>
                                    </div>
                                </td>
                                <td><span style={{ color: 'var(--text-2)' }}>{item.owner?.name || '—'}</span></td>
                                <td><span className="admin-badge">{item.category || 'General'}</span></td>
                                <td>₹{item.pricePerDay}</td>
                                <td><span className={`admin-badge ${item.status === 'active' ? 'admin-badge-green' : ''}`}>{item.status}</span></td>
                                <td>
                                    <button className="admin-delete-btn" onClick={() => { if (confirm(`Delete item "${item.title}"?`)) del.mutate(item._id) }}>
                                        <Trash2 size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {data && <Pagination page={page} pages={data.pages} setPage={setPage} />}
        </div>
    )
}

/* ── Reviews ──────────────────────────────────────────────── */
function ReviewsTab() {
    const [page, setPage] = useState(1)
    const qc = useQueryClient()

    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'reviews', page],
        queryFn: () => getAdminReviews({ page, limit: 15 }),
        keepPreviousData: true,
    })

    const del = useMutation({
        mutationFn: deleteReviewAdmin,
        onSuccess: () => { toast.success('Review deleted'); qc.invalidateQueries({ queryKey: ['admin'] }) },
        onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
    })

    return (
        <div>
            <h1 className="admin-page-title">Reviews</h1>
            <div className="admin-table-wrap">
                <table className="admin-table">
                    <thead>
                        <tr><th>Reviewer</th><th>Item</th><th>Rating</th><th>Comment</th><th>Date</th><th></th></tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>Loading…</td></tr>
                        ) : data?.reviews?.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>No reviews yet</td></tr>
                        ) : data?.reviews?.map((r) => (
                            <tr key={r._id}>
                                <td>{r.reviewer?.name || '—'}</td>
                                <td>{r.item?.title || '—'}</td>
                                <td>
                                    <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                                        {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                                    </span>
                                </td>
                                <td><span style={{ color: 'var(--text-2)', fontSize: 13 }}>{r.comment?.length > 60 ? r.comment.slice(0, 60) + '…' : r.comment}</span></td>
                                <td><span style={{ color: 'var(--text-3)', fontSize: 13 }}>{new Date(r.createdAt).toLocaleDateString()}</span></td>
                                <td>
                                    <button className="admin-delete-btn" onClick={() => { if (confirm('Delete this review?')) del.mutate(r._id) }}>
                                        <Trash2 size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {data && <Pagination page={page} pages={data.pages} setPage={setPage} />}
        </div>
    )
}

/* ── Pagination ───────────────────────────────────────────── */
function Pagination({ page, pages, setPage }) {
    if (!pages || pages <= 1) return null
    return (
        <div className="admin-pagination">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></button>
            <span>Page {page} of {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></button>
        </div>
    )
}

"use client";
import { useEffect, useState } from "react";

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
};

export function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const url = role ? `/api/users?role=${role}` : "/api/users";
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setUsers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [role]);
  if (loading) return <p className="text-slate-600">Loading…</p>;
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Filter by role
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2"
        >
          <option value="">All</option>
          <option value="ADMIN">Admin</option>
          <option value="MENTOR">Mentor</option>
          <option value="TRAINEE">Trainee</option>
        </select>
      </div>
      <ul className="space-y-2">
        {users.map((u) => (
          <li
            key={u.id}
            className="rounded-lg border border-slate-200 bg-white p-4 flex items-center justify-between"
          >
            <div>
              <span className="font-medium text-slate-800">{u.name}</span>
              <span className="text-slate-600 ml-2">({u.email})</span>
              <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {u.role}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

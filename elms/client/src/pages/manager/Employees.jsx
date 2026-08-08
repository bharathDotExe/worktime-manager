import { useEffect, useState, useMemo } from "react";
import { Users, Search, MoreVertical, Eye, Calendar, ArrowUpDown } from "lucide-react";
import Layout from "../../components/Layout.jsx";
import api, { errorMessage } from "../../api/client";
import { MANAGER_LINKS } from "../../nav";
import { cacheGet, cacheSet } from "../../api/cache";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  useEffect(() => {
    const cached = cacheGet("employees");
    if (cached) {
      setEmployees(cached);
      setLoading(false);
    }
    api
      .get("/employees")
      .then(({ data }) => {
        const list = data.employees || [];
        cacheSet("employees", list, 60_000);
        setEmployees(list);
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const empty = !loading && employees.length === 0;

  const formatName = (email) => {
    if (!email) return "";
    return email.split('@')[0].split('.').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  };

  const filteredAndSortedEmployees = useMemo(() => {
    let result = employees;
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(e => 
        e.username.toLowerCase().includes(lowerQuery) || 
        String(e.id).includes(lowerQuery) ||
        (e.full_name && e.full_name.toLowerCase().includes(lowerQuery)) ||
        (e.department && e.department.toLowerCase().includes(lowerQuery)) ||
        formatName(e.username).toLowerCase().includes(lowerQuery)
      );
    }
    
    if (sortConfig.key) {
      result = [...result].sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        if (sortConfig.key === 'name') {
          aVal = a.full_name || formatName(a.username);
          bVal = b.full_name || formatName(b.username);
        }
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [employees, searchQuery, sortConfig]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <Layout links={MANAGER_LINKS}>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#E7F2EC]">
            <Users className="h-5 w-5 text-[#0B6E4F]" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Employees</h1>
            <p className="text-sm text-slate-500">
              {loading ? "Loading employees…" : `${employees.length} Employee${employees.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 shadow-sm">
          <p role="alert" className="text-sm font-bold text-rose-800">{error}</p>
        </div>
      )}

      {/* Toolbar */}
      {!loading && !empty && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" strokeWidth={2.5} />
            </div>
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              className="block w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]/20 focus:border-[#0B6E4F] sm:text-sm transition-colors shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4"><div className="h-4 w-24 bg-slate-200 rounded animate-pulse"></div></th>
                  <th className="px-6 py-4"><div className="h-4 w-16 bg-slate-200 rounded animate-pulse"></div></th>
                  <th className="px-6 py-4"><div className="h-4 w-24 bg-slate-200 rounded animate-pulse"></div></th>
                  <th className="px-6 py-4"><div className="h-4 w-20 bg-slate-200 rounded animate-pulse"></div></th>
                  <th className="px-6 py-4"><div className="h-4 w-20 bg-slate-200 rounded animate-pulse"></div></th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-200 animate-pulse shrink-0"></div>
                        <div>
                          <div className="h-4 w-32 bg-slate-200 rounded animate-pulse mb-2"></div>
                          <div className="h-3 w-24 bg-slate-100 rounded animate-pulse"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-100 rounded animate-pulse"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-16 bg-slate-100 rounded-md animate-pulse"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-100 rounded animate-pulse"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-12 bg-slate-100 rounded animate-pulse"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-100 rounded-full animate-pulse"></div></td>
                    <td className="px-6 py-4"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {empty && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-slate-50 border border-slate-100 mb-4">
            <Users className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No employees found</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            There are currently no employee accounts registered in the system.
          </p>
        </div>
      )}
      
      {/* Search Empty State */}
      {!loading && !empty && filteredAndSortedEmployees.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm mt-6">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-slate-50 border border-slate-100 mb-4">
            <Search className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No results found</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            No employees match your search for "{searchQuery}". Try a different term or clear the search.
          </p>
          <button 
            onClick={() => setSearchQuery("")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white border-2 border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Mobile cards */}
      {!loading && !empty && filteredAndSortedEmployees.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 md:hidden">
          {filteredAndSortedEmployees.map((e) => (
            <article key={e.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm relative group overflow-hidden">
              <div className="flex min-w-0 items-center gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-[#E7F2EC] text-sm font-bold uppercase text-[#0B6E4F]">
                  {e.profile_pic_url ? (
                    <img src={`/api/auth/profile-pic/${e.profile_pic_url}`} alt={e.full_name || e.username} className="h-full w-full object-cover" />
                  ) : (
                    (e.full_name || e.username).slice(0, 2)
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-900">{e.full_name || formatName(e.username)}</p>
                  <p className="truncate text-xs font-medium text-slate-500 mt-0.5">{e.department || e.username}</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Requests</p>
                  <p className="font-semibold text-slate-900">{e.total_requests}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Status</p>
                  {e.pending_requests > 0 ? (
                    <span className="text-amber-600 font-bold text-xs">{e.pending_requests} Pending</span>
                  ) : (
                    <span className="text-emerald-600 font-bold text-xs">Active</span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Desktop table */}
      {!loading && !empty && filteredAndSortedEmployees.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-bold cursor-pointer hover:bg-slate-100 transition-colors group/th select-none" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-2">Employee <ArrowUpDown className={`h-3.5 w-3.5 transition-opacity ${sortConfig.key === 'name' ? 'opacity-100 text-[#0B6E4F]' : 'opacity-0 group-hover/th:opacity-100 text-slate-400'}`} /></div>
                  </th>
                  <th className="px-6 py-4 font-bold cursor-pointer hover:bg-slate-100 transition-colors group/th select-none" onClick={() => handleSort('department')}>
                    <div className="flex items-center gap-2">Department <ArrowUpDown className={`h-3.5 w-3.5 transition-opacity ${sortConfig.key === 'department' ? 'opacity-100 text-[#0B6E4F]' : 'opacity-0 group-hover/th:opacity-100 text-slate-400'}`} /></div>
                  </th>
                  <th className="px-6 py-4 font-bold cursor-pointer hover:bg-slate-100 transition-colors group/th select-none" onClick={() => handleSort('id')}>
                    <div className="flex items-center gap-2">ID <ArrowUpDown className={`h-3.5 w-3.5 transition-opacity ${sortConfig.key === 'id' ? 'opacity-100 text-[#0B6E4F]' : 'opacity-0 group-hover/th:opacity-100 text-slate-400'}`} /></div>
                  </th>
                  <th className="px-6 py-4 font-bold cursor-pointer hover:bg-slate-100 transition-colors group/th select-none" onClick={() => handleSort('created_at')}>
                    <div className="flex items-center gap-2">Joined <ArrowUpDown className={`h-3.5 w-3.5 transition-opacity ${sortConfig.key === 'created_at' ? 'opacity-100 text-[#0B6E4F]' : 'opacity-0 group-hover/th:opacity-100 text-slate-400'}`} /></div>
                  </th>
                  <th className="px-6 py-4 font-bold cursor-pointer hover:bg-slate-100 transition-colors group/th select-none" onClick={() => handleSort('total_requests')}>
                    <div className="flex items-center gap-2">Requests <ArrowUpDown className={`h-3.5 w-3.5 transition-opacity ${sortConfig.key === 'total_requests' ? 'opacity-100 text-[#0B6E4F]' : 'opacity-0 group-hover/th:opacity-100 text-slate-400'}`} /></div>
                  </th>
                  <th className="px-6 py-4 font-bold cursor-pointer hover:bg-slate-100 transition-colors group/th select-none" onClick={() => handleSort('pending_requests')}>
                    <div className="flex items-center gap-2">Status <ArrowUpDown className={`h-3.5 w-3.5 transition-opacity ${sortConfig.key === 'pending_requests' ? 'opacity-100 text-[#0B6E4F]' : 'opacity-0 group-hover/th:opacity-100 text-slate-400'}`} /></div>
                  </th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAndSortedEmployees.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 overflow-hidden rounded-full bg-[#E7F2EC] text-[#0B6E4F] flex items-center justify-center font-bold text-sm uppercase shrink-0">
                          {e.profile_pic_url ? (
                            <img src={`/api/auth/profile-pic/${e.profile_pic_url}`} alt={e.full_name || e.username} className="h-full w-full object-cover" />
                          ) : (
                            (e.full_name || e.username).slice(0, 2)
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{e.full_name || formatName(e.username)}</p>
                          <p className="text-[13px] text-slate-500 mt-0.5">{e.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {e.department || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold font-mono border border-slate-200/50">
                        EMP-{String(e.id).padStart(4, '0')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {new Date(e.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-900 font-bold">{e.total_requests}</span>
                      <span className="text-slate-500 text-xs ml-1 font-medium">Leaves</span>
                    </td>
                    <td className="px-6 py-4">
                      {e.pending_requests > 0 ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200/50">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                          {e.pending_requests} Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200/50">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-slate-400 hover:text-[#0B6E4F] hover:bg-[#E7F2EC] rounded-lg transition-colors" title="View Profile">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-[#0B6E4F] hover:bg-[#E7F2EC] rounded-lg transition-colors" title="Leave History">
                          <Calendar className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors ml-1" title="More Options">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}

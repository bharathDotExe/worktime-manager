import { useState, useRef } from "react";
import { User as UserIcon, Upload, Check } from "lucide-react";
import Layout from "../components/Layout.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { errorMessage } from "../api/client";
import { EMPLOYEE_LINKS, MANAGER_LINKS } from "../nav";

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(
    user?.profile_pic_url ? `/api/auth/profile-pic/${user.profile_pic_url}` : null
  );
  
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef(null);
  const links = user?.role === "manager" ? MANAGER_LINKS : EMPLOYEE_LINKS;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.size > 5 * 1024 * 1024) {
        setError("File must be smaller than 5MB");
        return;
      }
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setError("");
      setSuccess(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess(false);

    try {
      const fd = new FormData();
      if (fullName) fd.append("full_name", fullName);
      if (file) fd.append("profile_pic", file);

      await updateProfile(fd);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(errorMessage(err, "Failed to update profile"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout links={links}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Manage your profile and account settings.</p>
      </div>

      <div className="max-w-xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Profile Information</h2>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 shadow-sm">
              <p className="text-sm font-bold text-rose-800">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm">
              <Check className="h-5 w-5 text-emerald-600" />
              <p className="text-sm font-bold text-emerald-800">Profile updated successfully</p>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Profile Picture</label>
              <div className="flex items-center gap-6">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                  {preview ? (
                    <img src={preview} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <UserIcon className="h-10 w-10 text-slate-300" />
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-ghost flex items-center gap-2 px-4 py-2 text-sm"
                  >
                    <Upload className="h-4 w-4" />
                    Change Picture
                  </button>
                  <p className="mt-2 text-xs text-slate-500">
                    JPG or PNG up to 5MB.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg, image/png"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="label" htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                className="input"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setSuccess(false);
                }}
                placeholder="Enter your full name"
                minLength={2}
                maxLength={255}
              />
            </div>
            
            <div>
              <label className="label" htmlFor="department">Department</label>
              <input
                id="department"
                type="text"
                className="input bg-slate-50 text-slate-500"
                value={user?.department || "Not assigned"}
                disabled
              />
              <p className="mt-1 text-xs text-slate-400">Department cannot be changed here.</p>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button type="submit" disabled={busy} className="btn-primary w-full sm:w-auto px-8">
                {busy ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

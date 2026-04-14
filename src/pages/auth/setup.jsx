import { useState } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";

export default function Setup() {
  // Hardcoded roles
  const hardcodedRoles = {
    super_admin: "Super Administrator (Full Access)",
    mezmur_office_admin: "Mezmur Office Administrator",
    tmhrt_office_admin: "TMHRT Office Administrator",
    distance_admin: "Distance Learning Administrator",
    gngnunet_office_admin: "Gngnunet Office Administrator",
    young_gngnunet_admin: "Young Gngnunet Administrator",
    young_tmhrt_admin: "Young TMHRT Administrator",
  };

  const [roles] = useState(hardcodedRoles);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [role, setRole] = useState(Object.keys(hardcodedRoles)[0]);
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !name ||
      !username ||
      !password ||
      !passwordConfirm ||
      !role ||
      !securityQuestion ||
      !securityAnswer
    ) {
      setError("Please fill all fields");
      return;
    }

    if (password !== passwordConfirm) {
      setError("Passwords do not match");
      return;
    }

    try {
      await api.post("/system/initialize", {
        name,
        username,
        password,
        password_confirmation: passwordConfirm,
        role,
        security_question: securityQuestion,
        security_answer: securityAnswer,
      });

      // Clear previous user/session
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");

      // Redirect to login
      window.location.reload();
      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Setup failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-8">
          Initialize System
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Security Question */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Security Question
            </label>
            <input
              type="text"
              value={securityQuestion}
              onChange={(e) => setSecurityQuestion(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Security Answer */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Security Answer
            </label>
            <input
              type="text"
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-500"
              required
            >
              {Object.entries(roles).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            Initialize
          </button>
        </form>
      </div>
    </div>
  );
}

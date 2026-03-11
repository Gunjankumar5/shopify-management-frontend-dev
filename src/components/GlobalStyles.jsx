const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

    :root {
      --bg-primary: #0a0a0f;
      --bg-secondary: #0d0d14;
      --bg-card: #13131a;
      --bg-input: #13131a;
      --border-color: #1e1e2e;
      --border-light: #2a2a3d;
      --text-primary: #e8e8f0;
      --text-secondary: #888;
      --text-muted: #555;
      --accent: #6366f1;
      --accent-gradient: linear-gradient(135deg, #6366f1, #8b5cf6);
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
      --info: #3b82f6;
      --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.2);
      --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.3);
      --shadow-lg: 0 16px 40px rgba(0, 0, 0, 0.4);
      --transition: all 0.2s ease;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root { height: 100%; }
    body {
      font-family: 'DM Sans', sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: #13131a; }
    ::-webkit-scrollbar-thumb { background: #2a2a3d; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #3d3d5c; }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    .fade-up { animation: fadeUp 0.4s cubic-bezier(0.2, 0.9, 0.3, 1) forwards; }
    .card-hover {
      transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
    }
    .card-hover:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);
      border-color: var(--accent) !important;
    }

    .btn {
      border: none;
      cursor: pointer;
      font-family: inherit;
      font-weight: 600;
      transition: var(--transition);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border-radius: 12px;
      padding: 10px 18px;
      font-size: 14px;
      line-height: 1;
    }
    .btn:active { transform: scale(0.97); }
    .btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .btn-primary {
      background: var(--accent-gradient);
      color: white;
    }
    .btn-primary:hover:not(:disabled) {
      opacity: 0.9;
      box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
    }
    .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-secondary {
      background: var(--bg-card);
      border: 1px solid var(--border-light);
      color: var(--text-secondary);
    }
    .btn-secondary:hover:not(:disabled) {
      background: #252538;
      border-color: var(--accent);
      color: var(--text-primary);
    }
    .btn-danger {
      background: rgba(239, 68, 68, 0.1);
      color: var(--danger);
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .btn-danger:hover:not(:disabled) {
      background: rgba(239, 68, 68, 0.2);
      border-color: var(--danger);
    }

    .field-input {
      background: var(--bg-input);
      border: 1px solid var(--border-light);
      color: var(--text-primary);
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      font-family: inherit;
      width: 100%;
      border-radius: 10px;
      padding: 10px 14px;
      font-size: 14px;
    }
    .field-input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }
    .field-input::placeholder { color: #3d3d5c; }

    .chk {
      appearance: none;
      width: 20px;
      height: 20px;
      min-width: 20px;
      border: 2px solid var(--border-light);
      border-radius: 6px;
      cursor: pointer;
      background: var(--bg-input);
      position: relative;
      transition: var(--transition);
    }
    .chk:checked {
      background: var(--accent);
      border-color: var(--accent);
    }
    .chk:checked::after {
      content: '✓';
      position: absolute;
      color: white;
      font-size: 13px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    .chk:focus-visible { outline: 2px solid var(--accent); }

    .skeleton {
      background: linear-gradient(90deg, #1a1a2e 25%, #252540 50%, #1a1a2e 75%);
      background-size: 200% 100%;
      animation: shimmer 1.8s infinite;
      border-radius: 12px;
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-box {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 24px;
      width: 100%;
      max-height: calc(100vh - 40px);
      overflow-y: auto;
      box-shadow: var(--shadow-lg);
      animation: fadeUp 0.3s ease;
    }
    .modal-box::-webkit-scrollbar { width: 6px; }
  `}</style>
);

export default GlobalStyles;

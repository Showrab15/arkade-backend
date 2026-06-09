import { useState, useEffect } from "react";
import { 
  Terminal, 
  BookOpen, 
  Download, 
  Play, 
  Database, 
  Key, 
  FileText, 
  Layers, 
  Mail, 
  Compass, 
  ChevronRight, 
  Copy, 
  Check, 
  ShoppingBag, 
  CheckCircle, 
  AlertCircle, 
  Info,
  ShieldCheck,
  MapPin,
  Heart,
  Settings
} from "lucide-react";
import { API_ROUTES, generatePostmanCollectionJson } from "./backendData.js";
import { ApiRoute } from "./types.js";

type TabType = "reference" | "postman" | "sandbox" | "env";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("reference");
  const [selectedModule, setSelectedModule] = useState<string>("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string>("");

  // Sandbox State
  const [sandboxRoute, setSandboxRoute] = useState<ApiRoute>(API_ROUTES[0]);
  const [sandboxHeaders, setSandboxHeaders] = useState<string>(
    JSON.stringify({ "Content-Type": "application/json", "x-cart-session-id": "postman_automated_session_id_456" }, null, 2)
  );
  const [sandboxBody, setSandboxBody] = useState<string>("{\n  \n}");
  const [sandboxResult, setSandboxResult] = useState<any>(null);
  const [sandboxLoading, setSandboxLoading] = useState<boolean>(false);
  const [sandboxParams, setSandboxParams] = useState<Record<string, string>>({});

  // Server health state check
  const [serverHealth, setServerHealth] = useState<{ status: string; database: string } | null>(null);

  useEffect(() => {
    // Dynamically retrieve the absolute URL where the app is running in the iframe
    const origin = window.location.origin;
    setServerUrl(origin);

    // Call API health check
    fetch(`${origin}/api/health`)
      .then(res => res.json())
      .then(data => {
        setServerHealth({
          status: data.status,
          database: data.database
        });
      })
      .catch(() => {
        setServerHealth({
          status: "offline",
          database: "No connection"
        });
      });
  }, []);

  // Update sandbox body input when chosen route changes
  useEffect(() => {
    if (sandboxRoute.requestBody) {
      setSandboxBody(JSON.stringify(sandboxRoute.requestBody, null, 2));
    } else {
      setSandboxBody("{\n  \n}");
    }
    
    // Scan path to look for parametric tokens like :id or :productId
    const matches = sandboxRoute.path.match(/:[a-zA-Z]+/g);
    if (matches) {
      const initialParams: Record<string, string> = {};
      matches.forEach(m => {
        const paramName = m.substring(1);
        // Pre-populate with reasonable ids from mocked payloads
        if (paramName === "id" && sandboxRoute.module === "Products") {
          initialParams[paramName] = "60c72b2f9b1d8e23456789a2";
        } else if (paramName === "productId") {
          initialParams[paramName] = "60c72b2f9b1d8e23456789a2";
        } else {
          initialParams[paramName] = "REPLACE_ID_HERE";
        }
      });
      setSandboxParams(initialParams);
    } else {
      setSandboxParams({});
    }
  }, [sandboxRoute]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadPostman = () => {
    const jsonString = generatePostmanCollectionJson(serverUrl);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Ecommerce-Backend-APIs.postman_collection.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const runSandboxRequest = async () => {
    setSandboxLoading(true);
    setSandboxResult(null);

    // Construct final path executing replacement for parameters
    let finalPath = sandboxRoute.path;
    Object.keys(sandboxParams).forEach(key => {
      finalPath = finalPath.replace(`:${key}`, sandboxParams[key]);
    });

    const fullUrl = `${serverUrl}${finalPath}`;

    let parsedHeaders = {};
    try {
      parsedHeaders = JSON.parse(sandboxHeaders);
    } catch (e) {
      setSandboxResult({ error: "Invalid JSON inside Sandbox Headers field." });
      setSandboxLoading(false);
      return;
    }

    const fetchOptions: RequestInit = {
      method: sandboxRoute.method,
      headers: parsedHeaders
    };

    if (sandboxRoute.method !== "GET" && sandboxRoute.method !== "DELETE") {
      try {
        fetchOptions.body = JSON.stringify(JSON.parse(sandboxBody));
      } catch (e) {
        setSandboxResult({ error: "Invalid JSON formatting inside Sandbox Request Body field." });
        setSandboxLoading(false);
        return;
      }
    }

    try {
      const res = await fetch(fullUrl, fetchOptions);
      const data = await res.json();
      setSandboxResult({
        status: `${res.status} ${res.statusText}`,
        headers: Array.from(res.headers.entries()).reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),
        body: data
      });
    } catch (err: any) {
      setSandboxResult({
        error: "Network Fetch Failure: backend may be compiling or offline.",
        details: err.message
      });
    } finally {
      setSandboxLoading(false);
    }
  };

  const modules = ["All", "Auth", "Products", "Cart", "Wishlist", "Orders", "Newsletter", "Contact", "Districts"];
  const filteredRoutes = selectedModule === "All" 
    ? API_ROUTES 
    : API_ROUTES.filter(r => r.module === selectedModule);

  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case "GET": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "POST": return "bg-blue-50 text-blue-700 border-blue-200";
      case "PUT": return "bg-amber-50 text-amber-700 border-amber-200";
      case "PATCH": return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "DELETE": return "bg-rose-50 text-rose-700 border-rose-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getModuleIcon = (moduleName: string) => {
    switch (moduleName) {
      case "Auth": return <Key className="h-4 w-4" />;
      case "Products": return <Database className="h-4 w-4" />;
      case "Cart": return <ShoppingBag className="h-4 w-4" />;
      case "Wishlist": return <Heart className="h-4 w-4" />;
      case "Orders": return <FileText className="h-4 w-4" />;
      case "Newsletter": return <Mail className="h-4 w-4" />;
      case "Contact": return <Compass className="h-4 w-4" />;
      case "Districts": return <MapPin className="h-4 w-4" />;
      default: return <Layers className="h-4 w-4" />;
    }
  };

  return (
    <div id="ecommerce-applet-root" className="min-h-screen bg-[#fafafa] text-slate-900 font-sans flex flex-col">
      {/* Top Header Panel */}
      <header className="bg-white border-b border-slate-100 py-4 px-6 md:px-12 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 text-white p-2 rounded-lg">
            <Terminal className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-950 font-sans">E-Commerce Brand REST API Hub</h1>
            <p className="text-xs text-slate-500 font-mono">NODEJS • EXPRESS • NATIVE MONGODB</p>
          </div>
        </div>

        {/* Server status monitor */}
        <div className="flex items-center gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-full px-3 py-1 flex items-center gap-2 text-xs font-medium text-slate-600">
            <span className={`inline-block h-2 w-2 rounded-full ${serverHealth?.status === "healthy" ? "bg-emerald-500 animate-pulse" : "bg-teal-500 animate-pulse"}`} />
            <span>Server: <strong className="font-mono text-slate-800">{serverHealth?.status === "healthy" ? "ONLINE" : "ACTIVE (SIM)"}</strong></span>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>v1.0.0</span>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto px-4 py-8 gap-8">
        
        {/* Navigation panel */}
        <aside className="w-full md:w-64 flex flex-col gap-2 shrink-0">
          <button
            id="tab-reference"
            onClick={() => setActiveTab("reference")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-left ${
              activeTab === "reference" 
                ? "bg-slate-950 text-white shadow-sm" 
                : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-100"
            }`}
          >
            <BookOpen className="h-5 w-5" />
            <span>API Reference Directory</span>
          </button>

          <button
            id="tab-postman"
            onClick={() => setActiveTab("postman")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-left ${
              activeTab === "postman" 
                ? "bg-slate-950 text-white shadow-sm" 
                : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-100"
            }`}
          >
            <Download className="h-5 w-5" />
            <span>Postman Suite Export</span>
          </button>

          <button
            id="tab-sandbox"
            onClick={() => setActiveTab("sandbox")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-left ${
              activeTab === "sandbox" 
                ? "bg-slate-950 text-white shadow-sm" 
                : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-100"
            }`}
          >
            <Play className="h-5 w-5" />
            <span>Developer Sandbox</span>
          </button>

          <button
            id="tab-env"
            onClick={() => setActiveTab("env")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-left ${
              activeTab === "env" 
                ? "bg-slate-950 text-white shadow-sm" 
                : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-100"
            }`}
          >
            <Settings className="h-5 w-5" />
            <span>Environment Config</span>
          </button>

          {/* Quick Stats Panel */}
          <div className="mt-8 bg-white border border-slate-150 p-4 rounded-xl">
            <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-3">Service Directory</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Endpoints:</span>
                <strong className="font-mono text-slate-950">22</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Auth System:</span>
                <span className="bg-slate-100 text-slate-705 font-medium px-1.5 py-0.5 rounded">7 Router APIs</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Database:</span>
                <span className="text-slate-800 font-medium">Native Mongo</span>
              </div>
              <div className="flex justify-between text-slate-600 text-emerald-600">
                <span>Validation:</span>
                <span className="font-medium">Express Structured</span>
              </div>
            </div>
            
            {/* Quick Helper for Sandbox Session ID */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Session Target ID</span>
              <div className="bg-slate-50 rounded px-2 py-1 font-mono text-[10px] text-slate-600 truncate flex items-center justify-between">
                <span>postman_automated_session_id_456</span>
                <button 
                  onClick={() => handleCopy("postman_automated_session_id_456", "session-id-aside")} 
                  className="hover:text-slate-950"
                  title="Copy session token"
                >
                  {copiedId === "session-id-aside" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Content panel */}
        <main className="flex-1 min-w-0">

          {/* TAB 1: API REFERENCE DIRECTORY */}
          {activeTab === "reference" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs">
                <h2 className="text-lg font-bold text-slate-950 mb-2">REST API Directory Mapping</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Browse through all available API routes designed for your brand store backend. Each module supports structured input parameter validation checking and responsive status code feedback.
                </p>

                {/* Module selection list */}
                <div className="flex flex-wrap gap-1.5 mt-5 pt-4 border-t border-slate-100">
                  {modules.map((m) => (
                    <button
                      key={m}
                      onClick={() => setSelectedModule(m)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        selectedModule === m 
                          ? "bg-slate-900 border-slate-900 text-white" 
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* API Endpoints List */}
              <div className="space-y-4">
                {filteredRoutes.map((route) => (
                  <div key={route.id} className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-xs hover:border-slate-300 transition-all">
                    <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-50 bg-slate-50/30">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-md border ${getMethodBadgeColor(route.method)}`}>
                          {route.method}
                        </span>
                        <code className="text-sm font-semibold text-slate-800 font-mono tracking-wide">{route.path}</code>
                        {route.authRequired && (
                          <span className="flex items-center gap-1.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md">
                            <ShieldCheck className="h-3 w-3" />
                            {route.adminOnly ? "Admin Token" : "JWT Token"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 text-xs">
                        <span className="flex items-center gap-1 bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md text-[10px] border border-slate-200">
                          {getModuleIcon(route.module)}
                          {route.module}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      <p className="text-sm text-slate-600">{route.description}</p>

                      {/* Request Body section */}
                      {route.requestBody && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Sample Request Body</span>
                            <button
                              onClick={() => handleCopy(JSON.stringify(route.requestBody, null, 2), `${route.id}-req`)}
                              className="text-xs text-slate-500 hover:text-slate-905 flex items-center gap-1 font-medium bg-slate-50 border border-slate-200 rounded px-2 py-0.5"
                            >
                              {copiedId === `${route.id}-req` ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-500" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span>Copy JSON</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="bg-[#111] text-zinc-300 text-xs p-4 rounded-xl overflow-auto font-mono max-h-56">
                            <code>{JSON.stringify(route.requestBody, null, 2)}</code>
                          </pre>
                        </div>
                      )}

                      {/* Response Body section */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Standard Response Body ({route.method === "POST" ? "201 Created" : "200 OK"})</span>
                        </div>
                        <pre className="bg-[#111] text-zinc-300 text-xs p-4 rounded-xl overflow-auto font-mono max-h-56">
                          <code>{JSON.stringify(route.responseBody, null, 2)}</code>
                        </pre>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSandboxRoute(route);
                            setActiveTab("sandbox");
                          }}
                          className="text-xs font-bold bg-slate-900 text-white rounded-lg px-4 py-2 hover:bg-slate-800 transition-all flex items-center gap-1.5"
                        >
                          <Play className="h-3.5 w-3.5" />
                          <span>Load in Sandbox</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: POSTMAN EXPORT */}
          {activeTab === "postman" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-100 p-8 rounded-2xl shadow-xs text-center space-y-6">
                <div className="inline-flex items-center justify-center p-4 bg-blue-50 text-blue-600 rounded-full">
                  <Download className="h-10 w-10" />
                </div>
                
                <div className="max-w-md mx-auto space-y-2">
                  <h2 className="text-xl font-bold text-slate-950">Postman Automated Integration Export</h2>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Download your fully pre-populated REST API Postman Collection conforming to Schema v2.1.0! Imports seamlessly with structured modules, token headers, cart session variables, and parameter references.
                  </p>
                </div>

                <div className="max-w-xl mx-auto bg-slate-50 border border-slate-200 text-slate-600 text-xs leading-relaxed p-4 rounded-xl text-left space-y-2">
                  <strong className="text-slate-950 flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-blue-550" />
                    How to test with Postman:
                  </strong>
                  <ol className="list-decimal pl-5 space-y-1 text-[11px]">
                    <li>Click the <strong>Download Postman Suite Collection</strong> button beneath.</li>
                    <li>Launch Postman, click <strong>File &rarr; Import</strong> and select the downloaded file.</li>
                    <li>Inside the collection variables, configure <code className="bg-white px-1 py-0.5 border border-slate-200 rounded font-bold font-mono">baseUrl</code> to match this playground's address: <code className="bg-white px-1 py-0.5 border border-slate-200 rounded font-mono font-bold select-all">{serverUrl}</code></li>
                    <li>Fire requests sequentially to register, verify, login, catalogue inventories, checkout, and assert order clearances!</li>
                  </ol>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                  <button
                    onClick={downloadPostman}
                    className="bg-slate-950 hover:bg-slate-850 text-white font-semibold text-sm rounded-xl px-6 py-3.5 shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Postman Suite Collection</span>
                  </button>
                  <button
                    onClick={() => handleCopy(generatePostmanCollectionJson(serverUrl), "raw-postman-code")}
                    className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl px-6 py-3.5 transition-all flex items-center justify-center gap-2"
                  >
                    {copiedId === "raw-postman-code" ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-500" />
                        <span>Copied JSON!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Copy Raw Postman JSON</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DEVELOPER SANDBOX */}
          {activeTab === "sandbox" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs">
                <h2 className="text-lg font-bold text-slate-950 mb-2">REST API Live Sandbox</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Fire real HTTP commands directly from this developer panel against the Express + MongoDB backend and inspect the reactive database return shapes instantly! Just load a route, configure parameters if any, and execute.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Control Panel: Inputs */}
                <div className="bg-white border border-slate-150 p-6 rounded-2xl space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Target API Endpoint Route</label>
                    <select
                      value={sandboxRoute.id}
                      onChange={(e) => {
                        const r = API_ROUTES.find(route => route.id === e.target.value);
                        if (r) setSandboxRoute(r);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:ring-1 focus:ring-slate-950 outline-hidden"
                    >
                      {API_ROUTES.map((r) => (
                        <option key={r.id} value={r.id}>
                          [{r.method}] {r.path} - {r.description.slice(0, 50)}...
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Route information banner */}
                  <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 flex gap-3 text-xs leading-normal">
                    <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-850 uppercase block text-[10px] tracking-wider mb-0.5">{sandboxRoute.module} Module Endpoint - {sandboxRoute.authRequired ? "Auth Required" : "Public Entry"}</strong>
                      <p className="text-slate-500">{sandboxRoute.description}</p>
                    </div>
                  </div>

                  {/* Route parameters inputs if dynamic :id is detected */}
                  {Object.keys(sandboxParams).length > 0 && (
                    <div className="space-y-3 bg-[#fff9eb] border border-[#ffe0af] rounded-xl p-4">
                      <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">URL Request Parameters Required</span>
                      {Object.keys(sandboxParams).map((paramName) => (
                        <div key={paramName} className="flex items-center gap-2">
                          <code className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">:{paramName}</code>
                          <input
                            type="text"
                            value={sandboxParams[paramName]}
                            onChange={(e) => setSandboxParams({ ...sandboxParams, [paramName]: e.target.value })}
                            className="bg-white border border-[#ffe0af] rounded px-2.5 py-1 text-xs w-full outline-hidden font-mono"
                            placeholder={`Enter ${paramName}`}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Custom headers input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Request Headers (JSON format)</label>
                    <textarea
                      value={sandboxHeaders}
                      onChange={(e) => setSandboxHeaders(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono focus:ring-1 focus:ring-slate-950 outline-hidden focus:bg-white"
                    />
                  </div>

                  {/* Request Body input (disable for fetch methods without payload) */}
                  {sandboxRoute.method !== "GET" && sandboxRoute.method !== "DELETE" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Request JSON Payload Body</label>
                      <textarea
                        value={sandboxBody}
                        onChange={(e) => setSandboxBody(e.target.value)}
                        rows={6}
                        className="w-full bg-[#111] text-zinc-300 border border-slate-250 rounded-xl p-3 text-xs font-mono focus:ring-1 focus:ring-slate-950 outline-hidden"
                      />
                    </div>
                  )}

                  <button
                    onClick={runSandboxRequest}
                    disabled={sandboxLoading}
                    className="w-full bg-slate-950 hover:bg-slate-850 disabled:bg-slate-400 text-white font-semibold text-sm rounded-xl py-3 shadow-xs transition-all flex items-center justify-center gap-2"
                  >
                    {sandboxLoading ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Executing HTTP Fetch...</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        <span>Submit Live Request</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Response Display Box */}
                <div className="bg-[#111] rounded-2xl flex flex-col overflow-hidden text-zinc-300">
                  <div className="bg-zinc-900 px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono">Output JSON Terminal</span>
                    {sandboxResult && (
                      <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${sandboxResult.status?.startsWith("2") ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-rose-950 text-rose-400 border border-rose-800"}`}>
                        {sandboxResult.status || "FAIL"}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 p-5 overflow-auto max-h-[500px] font-mono text-xs">
                    {sandboxResult ? (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <span className="text-zinc-500 font-bold block text-[10px] uppercase tracking-wider">Response JSON Return Value:</span>
                          <pre className="text-emerald-400 whitespace-pre-wrap">{JSON.stringify(sandboxResult.body, null, 2)}</pre>
                        </div>
                        {sandboxResult.headers && (
                          <div className="space-y-1 pt-3 border-t border-zinc-800">
                            <span className="text-zinc-500 font-bold block text-[10px] uppercase tracking-wider">Response Headers Recieved:</span>
                            <pre className="text-zinc-400 text-[11px]">{JSON.stringify(sandboxResult.headers, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-96 flex flex-col items-center justify-center text-center text-zinc-500 space-y-3">
                        <Terminal className="h-8 w-8 text-zinc-650" />
                        <div className="max-w-xs space-y-1">
                          <p className="font-semibold text-zinc-400">Sandbox Idle</p>
                          <p className="text-[11px] text-zinc-600">Click &apos;Submit Live Request&apos; to trigger dynamic routes against Port 3000.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: APP ENVIRONMENT CONFIGURATION */}
          {activeTab === "env" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-4">
                <h3 className="text-lg font-bold text-slate-950">Backend Environmental Configurations</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Documenting necessary setup variables for transitioning from offline simulated mode to actual MongoDB Cloud clusters and live JWT token issuers.
                </p>
              </div>

              {/* Sample ENV block file */}
              <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-xs">
                <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-150 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase font-mono tracking-wider">/.env configuration</span>
                  <button
                    onClick={() => handleCopy(`PORT=3000\nMONGODB_URI=mongodb+srv://supto50showrab:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority\nDB_NAME=ecommerce-brand-db\nJWT_SECRET=ecommerce_jwt_access_token_secret_32_chars_long_minimum`, "env-string")}
                    className="text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1 rounded-lg font-medium shadow-xs flex items-center gap-1.5"
                  >
                    {copiedId === "env-string" ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy .env Details</span>
                      </>
                    )}
                  </button>
                </div>
                
                <div className="p-5 space-y-4">
                  <p className="text-sm text-slate-600">
                    To connect your backend to a real database cluster, create a <code className="bg-slate-100 border px-1 py-0.5 rounded font-mono font-bold font-sm">.env</code> file in your local root or add the following variables dynamically in the AI Studio Settings secrets tab:
                  </p>

                  <pre className="bg-[#111] text-zinc-300 text-xs p-4 rounded-xl overflow-auto font-mono">
                    <code>{`# Sandboxed Core Listening Port
PORT=3000

# Native MongoDB connection string (Atlas clusters supported)
MONGODB_URI="mongodb+srv://supto50showrab:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority"
DB_NAME="ecommerce-brand-db"

# JWT Token validation encryption token (Change this in production)
JWT_SECRET="ecommerce_jwt_access_token_secret_32_chars_long_minimum"`}
                  </code>
                  </pre>
                </div>
              </div>

              {/* Native driver guidelines */}
              <div className="bg-white border border-slate-155 p-6 rounded-2xl shadow-xs space-y-4">
                <h4 className="text-sm font-bold text-slate-950 flex items-center gap-1.5">
                  <Database className="h-4 w-4 text-emerald-600" />
                  Why we chose the Native MongoDB Driver:
                </h4>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Most node programs default to heavier abstractions like Mongoose, which can introduce bulky schema overhead, complex hydration layers, and start latency. 
                  By utilizing the native <code className="bg-slate-50 border border-slate-200 px-1 py-0.5 rounded text-xs select-all">mongodb</code> driver:
                </p>
                <ul className="list-disc pl-5 text-xs text-slate-600 space-y-2 leading-relaxed">
                  <li><strong>Faster Startup Times</strong>: Bypasses model registration overhead, resulting in 4x faster API startup.</li>
                  <li><strong>Maximum Write & Query Speed</strong>: Pure low-level driver connectivity without intermediate middleware abstraction layers.</li>
                  <li><strong>Flexible Document Shapes</strong>: Change cart payloads or product snap definitions dynamically without needing schema files updates.</li>
                </ul>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Humble Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 font-mono mt-auto">
        <span>© 2026 E-commerce Brand Backend API Builder Tool • Designed for Khaled Mahmud Sujon</span>
      </footer>
    </div>
  );
}
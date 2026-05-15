import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950">
      {/* Header */}
      <nav className="border-b border-gray-800 bg-gray-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              UBER CLI
            </div>
            <span className="text-gray-500">Plugin Registry</span>
          </div>
          <div className="flex gap-4">
            <Link to="/browse" className="px-4 py-2 text-gray-300 hover:text-white transition">
              Browse
            </Link>
            <a href="https://github.com/ubercodex/ubercli" target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-gray-300 hover:text-white transition">
              GitHub
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 py-32">
        <div className="text-center space-y-8">
          <h1 className="text-7xl font-bold">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Infinite Possibilities
            </span>
          </h1>
          <p className="text-2xl text-gray-400 max-w-3xl mx-auto">
            Build, share, and discover plugins that extend your terminal AI assistant with limitless capabilities
          </p>
          <div className="flex gap-4 justify-center pt-8">
            <Link
              to="/browse"
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold text-white hover:from-purple-500 hover:to-pink-500 transition shadow-lg shadow-purple-500/50"
            >
              Explore Plugins
            </Link>
            <a
              href="https://github.com/ubercodex/ubercli#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-gray-800 rounded-lg font-semibold text-white hover:bg-gray-700 transition"
            >
              Get Started
            </a>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-32">
          <div className="p-8 rounded-2xl bg-gray-900/50 border border-gray-800 hover:border-purple-500/50 transition">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-bold mb-2 text-white">Instant Publishing</h3>
            <p className="text-gray-400">
              Publish your plugins directly from the CLI. Share your creations with the community in seconds.
            </p>
          </div>
          <div className="p-8 rounded-2xl bg-gray-900/50 border border-gray-800 hover:border-pink-500/50 transition">
            <div className="text-4xl mb-4">🔧</div>
            <h3 className="text-xl font-bold mb-2 text-white">Build Anything</h3>
            <p className="text-gray-400">
              From web scrapers to API integrations, create tools that solve your unique problems.
            </p>
          </div>
          <div className="p-8 rounded-2xl bg-gray-900/50 border border-gray-800 hover:border-purple-500/50 transition">
            <div className="text-4xl mb-4">🌐</div>
            <h3 className="text-xl font-bold mb-2 text-white">Global Registry</h3>
            <p className="text-gray-400">
              Discover plugins from developers worldwide. Install with a single command.
            </p>
          </div>
        </div>

        {/* Code Example */}
        <div className="mt-32">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">Get Started in Seconds</h2>
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 font-mono text-sm">
              <div className="text-gray-500"># Install UberCLI</div>
              <div className="text-purple-400 mt-2">npm install -g ubercli</div>
              
              <div className="text-gray-500 mt-6"># Browse plugins</div>
              <div className="text-purple-400 mt-2">uber /plugins browse</div>
              
              <div className="text-gray-500 mt-6"># Install a plugin</div>
              <div className="text-purple-400 mt-2">uber /plugins install @author/plugin-name</div>
              
              <div className="text-gray-500 mt-6"># Publish your own</div>
              <div className="text-purple-400 mt-2">uber /plugins publish</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-32">
        <div className="max-w-7xl mx-auto px-6 py-12 text-center text-gray-500">
          <p>Built with ❤️ by the UberCodex community</p>
          <div className="flex gap-6 justify-center mt-4">
            <a href="https://github.com/ubercodex/ubercli" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
              GitHub
            </a>
            <a href="https://github.com/ubercodex/ubercli/issues" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
              Issues
            </a>
            <a href="https://github.com/ubercodex/ubercli#readme" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
              Docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Browse from './pages/Browse';
import PluginDetail from './pages/PluginDetail';

export default function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/plugins/:author/:name" element={<PluginDetail />} />
      </Routes>
    </div>
  );
}

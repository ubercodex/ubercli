import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import NewHome from './pages/NewHome';
import Registry from './pages/Registry';
import Contact from './pages/Contact';
import Publish from './pages/Publish';
import MyPlugins from './pages/MyPlugins';
import AuthCallback from './pages/AuthCallback';
import AdminDashboard from './pages/AdminDashboard';
import PluginDetail from './pages/PluginDetail';

export default function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<NewHome />} />
          <Route path="/registry" element={<Registry />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/publish" element={<Publish />} />
          <Route path="/my-plugins" element={<MyPlugins />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/plugins/:author/:name" element={<PluginDetail />} />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}

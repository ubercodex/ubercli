import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import NewHome from './pages/NewHome';
import Registry from './pages/Registry';
import Contact from './pages/Contact';
import Publish from './pages/Publish';
import MyPlugins from './pages/MyPlugins';
import AuthCallback from './pages/AuthCallback';
import AdminPanel from './pages/AdminPanel';
import PluginDetail from './pages/PluginDetail';
import Profiles from './pages/Profiles';
import ProfileDetail from './pages/ProfileDetail';
import PublishProfile from './pages/PublishProfile';

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
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/plugins/:author/:name" element={<PluginDetail />} />
          <Route path="/profiles" element={<Profiles />} />
          <Route path="/profiles/:author/:name" element={<ProfileDetail />} />
          <Route path="/publish-profile" element={<PublishProfile />} />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}

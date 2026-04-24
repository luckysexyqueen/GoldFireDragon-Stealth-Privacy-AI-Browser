import Layout from '@/components/feature/Layout';

const HOME_URL = 'https://readdy.cc/preview/633f3393-fb46-4a5a-8913-d6818284c2e9/8745039/';

export default function Home() {
  return (
    <Layout>
      <div className="flex flex-col" style={{ height: 'calc(100vh - 0px)' }}>
        <iframe
          src={HOME_URL}
          title="Stealth Home"
          className="w-full flex-1 border-none"
          style={{ minHeight: 'calc(100vh - 0px)' }}
          allow="fullscreen"
        />
      </div>
    </Layout>
  );
}
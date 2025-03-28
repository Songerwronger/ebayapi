import PriceSearch from '../components/PriceSearch';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            eBay Price Research Tool
          </h1>
          <p className="text-gray-600">
            Find average sold prices for items on eBay
          </p>
        </div>
        <PriceSearch />
      </main>
    </div>
  );
}

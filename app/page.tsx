import App from './components/App';

export default function Home() {
  return (
    <div className="container mx-auto max-w-5xl">
      <div className="mb-4">
        <p className="text-center text-neutral-600 dark:text-neutral-400">
          Race horses against each other in this physics-based simulation. Create custom maps or use existing ones!
        </p>
      </div>
      <App />
    </div>
  );
}

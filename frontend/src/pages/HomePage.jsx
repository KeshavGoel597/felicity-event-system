const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-white">
          <h1 className="text-6xl font-bold mb-4">Felicity</h1>
          <p className="text-2xl mb-8">Event Management System</p>
          <p className="text-lg mb-12 max-w-2xl mx-auto">
            Discover and register for exciting events at IIIT Hyderabad's annual fest
          </p>
          
          <div className="flex gap-4 justify-center">
            <a
              href="/login"
              className="px-8 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Login
            </a>
            <a
              href="/signup"
              className="px-8 py-3 bg-primary-700 text-white font-semibold rounded-lg hover:bg-primary-800 border-2 border-white transition-colors"
            >
              Sign Up
            </a>
          </div>

          <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">For Participants</h3>
              <p className="text-white/90">
                Browse events, register seamlessly, and manage your registrations
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">For Organizers</h3>
              <p className="text-white/90">
                Create and manage events, track registrations, and mark attendance
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">For Admins</h3>
              <p className="text-white/90">
                Oversee all events, approve organizers, and maintain the platform
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

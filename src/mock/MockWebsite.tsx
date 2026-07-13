export function MockWebsite({ pageUrl }: { pageUrl: string }) {
  if (pageUrl === "/contact") {
    return <ContactPage />;
  }
  return <HomePage />;
}

function HomePage() {
  return (
    <div className="min-h-full bg-white text-gray-900">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white">
              B
            </div>
            <span className="hero-logo text-lg font-bold">Bakkerij Van Dijk</span>
          </div>
          <nav className="hidden gap-6 text-sm md:flex">
            <a href="#" className="text-gray-600 hover:text-gray-900">
              Home
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900">
              Producten
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900">
              Over ons
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900">
              Contact
            </a>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-br from-amber-50 to-orange-100 px-6 py-16">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="hero-title mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Vers gebakken, elke dag
          </h1>
          <p className="hero-subtitle mx-auto mb-8 max-w-2xl text-lg text-gray-600">
            Ontdek ons assortiment ambachtelijk brood, gebak en taarten.
            Bestel online of kom langs in onze winkel.
          </p>
          <button className="hero-cta rounded-full bg-amber-500 px-8 py-3 text-sm font-semibold text-white shadow-lg hover:bg-amber-600">
            Bekijk ons assortiment
          </button>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {[
            { title: "Brood", desc: "Dagelijks vers gebakken" },
            { title: "Gebak", desc: "Huisgemaakte lekkernijen" },
            { title: "Taarten", desc: "Op maat gemaakt" },
          ].map((item) => (
            <div
              key={item.title}
              className="product-card rounded-xl border bg-white p-6 text-center shadow-sm"
            >
              <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-amber-100" />
              <h3 className="mb-2 font-semibold">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t bg-gray-50 px-6 py-8 text-center text-sm text-gray-500">
        &copy; 2026 Bakkerij Van Dijk — Mock website voor Bugtracker demo
      </footer>
    </div>
  );
}

function ContactPage() {
  return (
    <div className="min-h-full bg-white text-gray-900">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="text-lg font-bold">Bakkerij Van Dijk</span>
          <nav className="flex gap-4 text-sm text-gray-600">
            <a href="#">Home</a>
            <a href="#" className="font-medium text-gray-900">
              Contact
            </a>
          </nav>
        </div>
      </header>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-lg">
          <h1 className="mb-6 text-3xl font-bold">Contact</h1>
          <form className="contact-form space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Naam</label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Uw naam"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">E-mail</label>
              <input
                type="email"
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="uw@email.nl"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Bericht</label>
              <textarea
                className="w-full rounded-md border px-3 py-2 text-sm"
                rows={4}
                placeholder="Uw bericht..."
              />
            </div>
            <button
              type="button"
              className="w-full rounded-md bg-amber-500 py-2 text-sm font-semibold text-white"
            >
              Versturen
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

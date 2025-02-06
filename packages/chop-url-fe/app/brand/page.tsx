import Image from 'next/image';

export default function BrandPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <div className="space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">Chop URL Brand Kit</h1>
          <p className="text-lg text-gray-600">
            Resources for showcasing the Chop URL brand accurately and uniformly
          </p>
        </div>

        {/* Wordmark Section */}
        <section className="space-y-6 pt-10">
          <h2 className="text-2xl font-semibold">Wordmark</h2>
          <p className="text-gray-600">
            The Chop URL wordmark is our primary brand identifier, designed for
            clarity and recognition across all platforms.
          </p>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-lg border border-gray-200 p-6">
              <div className="bg-white">
                <Image
                  src="/wordmark.svg"
                  alt="Chop URL Wordmark"
                  width={400}
                  height={100}
                  className="dark:invert"
                />
              </div>
              <p className="mt-4 text-sm text-gray-500">Light Mode</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-6 bg-gray-950">
              <div className="bg-gray-950">
                <Image
                  src="/wordmark.svg"
                  alt="Chop URL Wordmark Dark"
                  width={400}
                  height={100}
                  className="invert"
                />
              </div>
              <p className="mt-4 text-sm text-gray-400">Dark Mode</p>
            </div>
          </div>
        </section>

        {/* Logo Section */}
        <section className="space-y-6 pt-10">
          <h2 className="text-2xl font-semibold">Logo</h2>
          <p className="text-gray-600">
            Our logo symbolizes the core function of Chop URL - making links
            shorter and more manageable. The scissors icon represents the act of
            shortening, while maintaining a clean and professional appearance.
          </p>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-lg border border-gray-200 p-6">
              <div className="bg-white flex justify-center">
                <Image
                  src="/logo.svg"
                  alt="Chop URL Logo"
                  width={200}
                  height={200}
                />
              </div>
              <p className="mt-4 text-sm text-gray-500">Primary Logo</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-6 bg-gray-950">
              <div className="bg-gray-950 flex justify-center">
                <Image
                  src="/logo.svg"
                  alt="Chop URL Logo on Dark"
                  width={200}
                  height={200}
                />
              </div>
              <p className="mt-4 text-sm text-gray-400">
                Logo on Dark Background
              </p>
            </div>
          </div>
        </section>

        {/* Usage Guidelines */}
        <section className="space-y-6 pt-10">
          <h2 className="text-2xl font-semibold">Usage Guidelines</h2>
          <div className="space-y-4">
            <h3 className="text-xl font-medium">Do</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Use the provided SVG files for best quality</li>
              <li>Maintain the original proportions when scaling</li>
              <li>Ensure adequate spacing around the logo and wordmark</li>
              <li>Use the appropriate version for light/dark backgrounds</li>
            </ul>
            <h3 className="text-xl font-medium pt-4">Don't</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Modify the colors or proportions</li>
              <li>Add effects or alterations to the original design</li>
              <li>
                Use the logo or wordmark in a way that suggests endorsement
              </li>
              <li>Place the logo on busy backgrounds that reduce visibility</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

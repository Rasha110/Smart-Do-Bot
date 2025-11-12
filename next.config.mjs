
  


  /** @type {import('next').NextConfig} */
  const nextConfig = {
    reactStrictMode: true,
    experimental: {
      turbo: true, // Turbopack dev server
    },
  };
  
    // Exclude Supabase functions from the build
    webpack: (config, { isServer }) => {
      if (isServer) {
        config.externals = config.externals || [];
        config.externals.push({
          'supabase': 'supabase'
        });
      }
      
      // Ignore Supabase functions directory
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ['**/supabase/functions/**', '**/node_modules/**']
      };
      
      return config;
    }
  
  
  export default nextConfig;
  
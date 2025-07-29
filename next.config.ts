module.exports = {
  rewrites: async () => [
  {
    source: '/media/:path*',
    destination: `${process.env.NEXT_PUBLIC_API_URL}/api/media/file/:path*`,
  },
],

  }


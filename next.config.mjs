/** @type {import('next').NextConfig} */

// basePath لازم يطابق اسم الـ repo على GitHub Pages.
// مثال: لو الموقع على https://USERNAME.github.io/lumiere-orders/ يبقى "/lumiere-orders".
// يتحط في الـ CI كمتغير NEXT_PUBLIC_BASE_PATH، ومحلياً يفضل فاضي.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = {
  output: "export",              // static export -> يشتغل على GitHub Pages
  basePath: basePath,
  assetPrefix: basePath ? basePath + "/" : undefined,
  images: { unoptimized: true }, // مطلوب مع static export
  trailingSlash: true,           // أنسب لـ GitHub Pages
  reactStrictMode: true
};

export default nextConfig;

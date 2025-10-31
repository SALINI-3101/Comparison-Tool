import type { NextConfig } from 'next';

type WebpackRule = {
  test?: RegExp;
  issuer?: string | RegExp | ((issuerPath: string) => boolean);
  resourceQuery?: RegExp | { not: RegExp[] };
  exclude?: RegExp;
  use?: string | string[];
  [key: string]: unknown;
};

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true,
  },
  webpack(config) {
    const fileLoaderRule = (config.module.rules as WebpackRule[]).find((rule: WebpackRule) =>
      (rule as WebpackRule).test?.test?.('.svg'),
    ) as WebpackRule;

    (config.module.rules as WebpackRule[]).push(
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/,
      },
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: [...(fileLoaderRule.resourceQuery as any).not, /url/] },
        use: ['@svgr/webpack'],
      },
      {
        test: /\.gif$/i,
        resourceQuery: /url/,
        type: 'asset/resource',
      },
    );

    (fileLoaderRule as any).exclude = /\.svg$/i;

    return config;
  },
};

export default nextConfig;


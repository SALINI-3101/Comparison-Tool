import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="A modern Next.js starter template" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* Critical CSS to prevent FOUC */
              #__next {
                opacity: 1;
              }
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // CRITICAL: This must run synchronously BEFORE any content renders
              (function() {
                var savedTheme = null;
                try {
                  savedTheme = localStorage.getItem('theme');
                } catch (e) {}

                var theme = (savedTheme === 'dark' || savedTheme === 'light') ? savedTheme : 'light';
                document.documentElement.setAttribute('data-theme', theme);

                // Also set it on body immediately for faster application
                document.documentElement.style.backgroundColor = theme === 'dark' ? '#111827' : '#f9fafb';
              })();
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

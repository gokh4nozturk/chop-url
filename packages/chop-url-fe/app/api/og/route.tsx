import { ImageResponse } from '@vercel/og';
import React from 'react';

export const runtime = 'edge';

const loadGoogleFont = async (font: string, text: string, weights: string) => {
  const url = `https://fonts.googleapis.com/css2?family=${font}:wght@${weights}&text=${encodeURIComponent(
    text
  )}`;
  const css = await (await fetch(url)).text();
  const resource = css.match(
    /src: url\((.+)\) format\('(opentype|truetype)'\)/
  );

  if (resource) {
    const response = await fetch(resource[1]);
    if (response.status === 200) {
      return await response.arrayBuffer();
    }
  }

  throw new Error('failed to load font data');
};

export async function GET() {
  const text = 'Chop URL - URL Shortener';
  try {
    return new ImageResponse(
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(249, 250, 251, 1)',
          padding: '60px',
          position: 'relative',
          overflow: 'hidden',
          color: 'rgba(17, 16, 16, 1)',
          fontFamily:
            'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", sans-serif',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        }}
      >
        {/* Decorative Background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: '130%',
            height: '130%',
            overflow: 'hidden',
            display: 'flex',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: '-10px',
              background:
                'linear-gradient(to right, rgba(255, 0, 128, 0.1), rgba(121, 40, 202, 0.1), rgba(255, 0, 128, 0.1))',
              filter: 'blur(16px)',
              opacity: 0.2,
              backgroundSize: '300%',
              pointerEvents: 'none',
              display: 'flex',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '25%',
              left: '-25%',
              width: '50%',
              height: '80%',
              background: 'rgba(255, 0, 128, 0.2)',
              borderRadius: '50%',
              filter: 'blur(16px)',
              pointerEvents: 'none',
              display: 'flex',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '33%',
              right: '-25%',
              width: '50%',
              height: '80%',
              background: 'rgba(121, 40, 202, 0.2)',
              borderRadius: '50%',
              filter: 'blur(16px)',
              pointerEvents: 'none',
              display: 'flex',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-25%',
              left: '33%',
              width: '50%',
              height: '80%',
              background: 'rgba(255, 0, 128, 0.2)',
              borderRadius: '50%',
              filter: 'blur(16px)',
              pointerEvents: 'none',
              display: 'flex',
            }}
          />
        </div>
        {/* Content */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '24px',
            marginBottom: '40px',
          }}
        >
          <img
            src="https://storage.chop-url.com/assets/logo.svg"
            alt="logo"
            height={120}
            width={120}
          />
          <span
            style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
          >
            <p
              style={{
                fontSize: '64px',
                fontWeight: '700',
                margin: 0,
                lineHeight: '1',
              }}
            >
              Chop URL
            </p>
            <p
              style={{
                fontSize: '32px',
                fontWeight: '500',
                margin: 0,
                opacity: 0.9,
              }}
            >
              URL Shortener
            </p>
          </span>
        </div>
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            bottom: '20px',
            right: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
          }}
        >
          <img
            src="https://pub-e80ae7bbbfd0439e86c73b572dc9e5b0.r2.dev/profile.svg?w=56&h=56"
            alt="gokh4nozturk"
            height={56}
            width={56}
          />
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
        emoji: 'fluent',
        debug: false,
        fonts: [
          {
            name: 'Inter',
            data: await loadGoogleFont('Inter', text, '400'),
            weight: 400,
          },
          {
            name: 'Inter',
            data: await loadGoogleFont('Inter', text, '500'),
            weight: 500,
          },
          {
            name: 'Inter',
            data: await loadGoogleFont('Inter', text, '600'),
            weight: 600,
          },
          {
            name: 'Inter',
            data: await loadGoogleFont('Inter', text, '700'),
            weight: 700,
          },
        ],
      }
    );
  } catch (e: unknown) {
    console.log(`${(e as Error).message}`);
    return new Response('Failed to generate the image', {
      status: 500,
    });
  }
}

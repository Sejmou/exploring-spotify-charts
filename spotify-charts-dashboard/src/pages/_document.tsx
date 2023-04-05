import { Html, Head, Main, NextScript } from "next/document";
// https://nextjs.org/docs/advanced-features/custom-document

export default function Document() {
  return (
    <Html>
      <Head />
      <body className="bg-[#121212]">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
